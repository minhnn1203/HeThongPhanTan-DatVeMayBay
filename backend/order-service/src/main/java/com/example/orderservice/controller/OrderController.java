package com.example.orderservice.controller;

import com.example.orderservice.entity.OrderEntity;
import com.example.orderservice.event.KafkaTopics;
import com.example.orderservice.event.OrderCreatedEvent;
import com.example.orderservice.repository.OrderRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {
    private static final Logger logger = LoggerFactory.getLogger(OrderController.class);
    private final OrderRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RestTemplate restTemplate;

    public OrderController(OrderRepository repository, KafkaTemplate<String, Object> kafkaTemplate, RestTemplate restTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.restTemplate = restTemplate;
    }

    @GetMapping
    public List<OrderEntity> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderEntity> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @CircuitBreaker(name = "bookingDependency", fallbackMethod = "createOrderFallback")
    public ResponseEntity<?> createOrder(@RequestBody OrderEntity order) {
        if (order.getFlightId() == null) {
            return ResponseEntity.badRequest().body("flightId is required");
        }
        Map<?, ?> user;
        Map<?, ?> flight;
        try {
            user = restTemplate.getForObject("http://user-service:8081/api/users/" + order.getUserId(), Map.class);
            flight = restTemplate.getForObject("http://product-service:8082/api/flights/" + order.getFlightId(), Map.class);
        } catch (ResourceAccessException ex) {
            throw ex;
        } catch (RestClientException ex) {
            logger.error("Cannot validate order dependencies: {}", ex.getMessage());
            return ResponseEntity.badRequest().body("User or flight not found");
        }
        if (user == null || flight == null) {
            return ResponseEntity.badRequest().body("User or flight not found");
        }

        String email = String.valueOf(user.get("email"));
        String passengerName = String.valueOf(user.get("username"));
        Number price = (Number) flight.get("price");
        if (price == null || order.getQuantity() == null || order.getQuantity() <= 0) {
            return ResponseEntity.badRequest().body("Invalid flight price or ticket quantity");
        }
        order.setCustomerEmail(email);
        order.setPassengerName(passengerName);
        order.setTotalAmount(price.doubleValue() * order.getQuantity());
        order.setStatus("PENDING_INVENTORY");
        OrderEntity saved = repository.save(order);
        kafkaTemplate.send(KafkaTopics.ORDER_CREATED,
                new OrderCreatedEvent(saved.getId(), saved.getUserId(), saved.getFlightId(), saved.getQuantity(), saved.getCustomerEmail(), saved.getPassengerName()));
        logger.info("Published Kafka order.created event for orderId={}", saved.getId());
        return ResponseEntity.ok(saved);
    }

    public ResponseEntity<?> createOrderFallback(OrderEntity order, Throwable throwable) {
        logger.error("Circuit breaker opened while creating booking: {}", throwable.getMessage());
        return ResponseEntity.status(503).body("Booking dependencies are temporarily unavailable");
    }

    @PutMapping("/{id}")
    public ResponseEntity<OrderEntity> update(@PathVariable Long id, @RequestBody OrderEntity order) {
        return repository.findById(id)
                .map(existing -> {
                    existing.setQuantity(order.getQuantity());
                    existing.setStatus(order.getStatus());
                    return ResponseEntity.ok(repository.save(existing));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        return repository.findById(id)
                .map(existing -> {
                    repository.delete(existing);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
