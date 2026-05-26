package com.example.orderservice.controller;

import com.example.orderservice.entity.OrderEntity;
import com.example.orderservice.event.KafkaTopics;
import com.example.orderservice.event.OrderCreatedEvent;
import com.example.orderservice.repository.OrderRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);
    private final OrderRepository repository;
    private final KafkaTemplate<String, Object> kafkaTemplate;
    private final RestTemplate restTemplate;

    public BookingController(OrderRepository repository, KafkaTemplate<String, Object> kafkaTemplate, RestTemplate restTemplate) {
        this.repository = repository;
        this.kafkaTemplate = kafkaTemplate;
        this.restTemplate = restTemplate;
    }

    @CircuitBreaker(name = "bookingDependency", fallbackMethod = "createBookingFallback")
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody Map<String, Object> payload,
                                           @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized: missing or invalid token"));
        }

        Long userId = payload.get("userId") != null ? ((Number) payload.get("userId")).longValue() : null;
        Long flightId = payload.get("flightId") != null ? ((Number) payload.get("flightId")).longValue() : null;
        Integer quantity = payload.get("quantity") != null ? ((Number) payload.get("quantity")).intValue() : null;

        if (userId == null || flightId == null || quantity == null || quantity <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId, flightId, and quantity are required"));
        }

        Map<?, ?> user = fetchUser(userId, authHeader);
        Map<?, ?> flight = fetchFlight(flightId);

        if (user == null) {
            logger.warn("Booking failed: user {} not found", userId);
            return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
        }
        if (flight == null) {
            logger.warn("Booking failed: flight {} not found", flightId);
            return ResponseEntity.badRequest().body(Map.of("error", "Flight not found"));
        }

        Object seatsObj = flight.get("availableSeats");
        int availableSeats = seatsObj != null ? ((Number) seatsObj).intValue() : 0;
        if (availableSeats < quantity) {
            logger.warn("Booking failed: not enough seats. requested={}, available={}", quantity, availableSeats);
            return ResponseEntity.badRequest().body(Map.of("error", "Not enough seats available. Only " + availableSeats + " seats left."));
        }

        Object priceObj = flight.get("price");
        double price = priceObj != null ? ((Number) priceObj).doubleValue() : 0.0;
        if (price <= 0) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid flight price"));
        }

        String email = String.valueOf(user.get("email"));
        String username = String.valueOf(user.get("username"));
        if (username.equals("null")) username = String.valueOf(user.get("fullName"));
        if (username.equals("null")) username = "Customer";

        OrderEntity order = new OrderEntity();
        order.setUserId(userId);
        order.setFlightId(flightId);
        order.setQuantity(quantity);
        order.setCustomerEmail(email);
        order.setPassengerName(username);
        order.setTotalAmount(price * quantity);
        order.setStatus("PENDING_INVENTORY");

        OrderEntity saved = repository.save(order);
        logger.info("Created booking: orderId={}, userId={}, flightId={}, qty={}, amount={}",
                saved.getId(), userId, flightId, quantity, saved.getTotalAmount());

        kafkaTemplate.send(KafkaTopics.ORDER_CREATED,
                new OrderCreatedEvent(saved.getId(), userId, flightId, quantity, email, username));

        return ResponseEntity.ok(saved);
    }

    private Map<?, ?> fetchUser(Long userId, String authHeader) {
        try {
            HttpHeaders headers = new HttpHeaders();
            if (authHeader != null) {
                headers.set("Authorization", authHeader);
            }
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    "http://user-service:8081/api/users/" + userId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            return response.getBody();
        } catch (RestClientException ex) {
            logger.warn("Failed to fetch user {}: {}", userId, ex.getMessage());
            return null;
        }
    }

    private Map<?, ?> fetchFlight(Long flightId) {
        try {
            HttpHeaders headers = new HttpHeaders();
            HttpEntity<Void> entity = new HttpEntity<>(headers);
            ResponseEntity<Map> response = restTemplate.exchange(
                    "http://product-service:8082/api/flights/" + flightId,
                    HttpMethod.GET,
                    entity,
                    Map.class
            );
            return response.getBody();
        } catch (RestClientException ex) {
            logger.warn("Failed to fetch flight {}: {}", flightId, ex.getMessage());
            return null;
        }
    }

    @SuppressWarnings("unused")
    private ResponseEntity<?> createBookingFallback(Map<String, Object> payload, String authHeader, Throwable throwable) {
        logger.error("Circuit breaker opened for booking: {}", throwable.getMessage());
        return ResponseEntity.status(503).body(Map.of(
                "error", "Booking service is temporarily unavailable. Please try again later.",
                "reason", "Circuit breaker is open due to service dependencies being unavailable"
        ));
    }

    @GetMapping
    public ResponseEntity<?> getBookingsByUser(@RequestParam Long userId,
                                                @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        List<OrderEntity> orders = repository.findByUserId(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id,
                                             @RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}