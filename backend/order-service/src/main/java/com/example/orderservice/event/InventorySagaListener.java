package com.example.orderservice.event;

import com.example.orderservice.entity.OrderEntity;
import com.example.orderservice.repository.OrderRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class InventorySagaListener {
    private static final Logger logger = LoggerFactory.getLogger(InventorySagaListener.class);

    private final OrderRepository repository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public InventorySagaListener(OrderRepository repository,
                                  KafkaTemplate<String, String> kafkaTemplate,
                                  ObjectMapper objectMapper) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_RESERVED, groupId = "order-service")
    public void onInventoryReserved(InventoryEvent event) {
        repository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("CONFIRMED");
            OrderEntity saved = repository.save(order);
            logger.info("Saga completed: booking confirmed orderId={}", saved.getId());

            // Publish customer email notification via Kafka
            kafkaTemplate.send(KafkaTopics.BOOKING_CONFIRMED,
                    buildJsonString(new BookingConfirmedEvent(saved.getId(), saved.getUserId(), saved.getFlightId(),
                            saved.getQuantity(), saved.getCustomerEmail(), saved.getPassengerName(), saved.getTotalAmount())));
            logger.info("Published booking.confirmed event for orderId={}", saved.getId());

            // Publish admin notification via Kafka (correct AdminNotificationEvent)
            AdminNotificationEvent adminEvent = new AdminNotificationEvent(saved.getId(), saved.getFlightId(),
                    saved.getPassengerName(), saved.getCustomerEmail(), saved.getQuantity(),
                    saved.getTotalAmount(), "CONFIRMED");
            kafkaTemplate.send(KafkaTopics.ADMIN_NOTIFICATION,
                    buildJsonString(adminEvent));
            logger.info("Published admin.notification event for orderId={}", saved.getId());
        });
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_FAILED, groupId = "order-service")
    public void onInventoryFailed(InventoryEvent event) {
        repository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("CANCELLED_" + event.getReason());
            repository.save(order);
            logger.warn("Saga compensated: booking cancelled orderId={} reason={}", event.getOrderId(), event.getReason());

            // Publish admin notification for cancelled booking via Kafka
            AdminNotificationEvent adminEvent = new AdminNotificationEvent(order.getId(), order.getFlightId(),
                    order.getPassengerName(), order.getCustomerEmail(), order.getQuantity(),
                    order.getTotalAmount(), "CANCELLED_" + event.getReason());
            kafkaTemplate.send(KafkaTopics.ADMIN_NOTIFICATION,
                    buildJsonString(adminEvent));
            logger.info("Published admin.notification for cancelled orderId={}", order.getId());
        });
    }

    private String buildJsonString(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            logger.error("Failed to serialize Kafka message: {}", e.getMessage());
            return "{}";
        }
    }
}