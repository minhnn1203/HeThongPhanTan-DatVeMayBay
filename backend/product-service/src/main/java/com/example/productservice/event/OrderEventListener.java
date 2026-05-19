package com.example.productservice.event;

import com.example.productservice.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class OrderEventListener {
    private static final Logger logger = LoggerFactory.getLogger(OrderEventListener.class);
    private final ProductRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public OrderEventListener(ProductRepository repository, KafkaTemplate<String, Object> kafkaTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
    }

    @KafkaListener(topics = KafkaTopics.ORDER_CREATED, groupId = "flight-service")
    public void handleOrderCreated(OrderCreatedEvent event) {
        logger.info("Saga step inventory: order={}, flight={}, qty={}", event.getOrderId(), event.getFlightId(), event.getQuantity());
        repository.findById(event.getFlightId()).ifPresentOrElse(flight -> {
            if (flight.getAvailableSeats() == null || event.getQuantity() == null || event.getQuantity() <= 0) {
                kafkaTemplate.send(KafkaTopics.INVENTORY_FAILED, new InventoryEvent(event.getOrderId(), event.getFlightId(), event.getQuantity(), "INVALID_QUANTITY"));
                return;
            }
            if (flight.getAvailableSeats() < event.getQuantity()) {
                kafkaTemplate.send(KafkaTopics.INVENTORY_FAILED, new InventoryEvent(event.getOrderId(), event.getFlightId(), event.getQuantity(), "NOT_ENOUGH_SEATS"));
                logger.warn("Inventory failed: orderId={} flightId={} available={}", event.getOrderId(), event.getFlightId(), flight.getAvailableSeats());
                return;
            }

            int newSeats = flight.getAvailableSeats() - event.getQuantity();
            flight.setAvailableSeats(newSeats);
            repository.save(flight);
            kafkaTemplate.send(KafkaTopics.INVENTORY_RESERVED, new InventoryEvent(event.getOrderId(), event.getFlightId(), event.getQuantity(), "RESERVED"));
            logger.info("Reserved seats: flightId={} availableSeats={}", flight.getId(), newSeats);
        }, () -> kafkaTemplate.send(KafkaTopics.INVENTORY_FAILED, new InventoryEvent(event.getOrderId(), event.getFlightId(), event.getQuantity(), "FLIGHT_NOT_FOUND")));
    }
}
