package com.example.orderservice.event;

import com.example.orderservice.entity.OrderEntity;
import com.example.orderservice.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class InventorySagaListener {
    private static final Logger logger = LoggerFactory.getLogger(InventorySagaListener.class);
    private final OrderRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public InventorySagaListener(OrderRepository repository, KafkaTemplate<String, Object> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_RESERVED, groupId = "order-service")
    public void onInventoryReserved(InventoryEvent event) {
        repository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("CONFIRMED");
            OrderEntity saved = repository.save(order);
            kafkaTemplate.send(KafkaTopics.BOOKING_CONFIRMED,
                    new BookingConfirmedEvent(saved.getId(), saved.getUserId(), saved.getFlightId(), saved.getQuantity(),
                            saved.getCustomerEmail(), saved.getPassengerName(), saved.getTotalAmount()));
            logger.info("Saga completed: booking confirmed orderId={}", saved.getId());
        });
    }

    @KafkaListener(topics = KafkaTopics.INVENTORY_FAILED, groupId = "order-service")
    public void onInventoryFailed(InventoryEvent event) {
        repository.findById(event.getOrderId()).ifPresent(order -> {
            order.setStatus("CANCELLED_" + event.getReason());
            repository.save(order);
            logger.warn("Saga compensated: booking cancelled orderId={} reason={}", event.getOrderId(), event.getReason());
        });
    }
}
