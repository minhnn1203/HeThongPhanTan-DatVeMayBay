package com.example.notificationservice.event;

import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AdminNotificationListener {
    private static final Logger logger = LoggerFactory.getLogger(AdminNotificationListener.class);
    private static final String RECIPIENT_TYPE = "ADMIN";

    private final NotificationRepository repository;

    public AdminNotificationListener(NotificationRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = KafkaTopics.ADMIN_NOTIFICATION, groupId = "notification-service")
    public void onAdminNotification(String payload) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            // Try to parse as AdminNotificationEvent first
            AdminNotificationEvent event = objectMapper.readValue(payload, AdminNotificationEvent.class);

            String message = String.format(
                    "[ADMIN ALERT] New booking #%d - Passenger: %s | Flight ID: %d | Seats: %d | Amount: %.0f VND | Status: %s | Customer: %s",
                    event.getOrderId(), event.getPassengerName(), event.getFlightId(),
                    event.getQuantity(), event.getTotalAmount(), event.getStatus(), event.getCustomerEmail());

            Notification notification = new Notification(
                    event.getOrderId(),
                    event.getFlightId(),
                    message,
                    RECIPIENT_TYPE,
                    "admin@flightbooking.com",
                    event.getStatus()
            );
            repository.save(notification);
            logger.info("Admin notification saved: orderId={}, status={}", event.getOrderId(), event.getStatus());
        } catch (Exception e) {
            logger.error("Failed to process admin notification from topic='{}': {}",
                    KafkaTopics.ADMIN_NOTIFICATION, e.getMessage());
        }
    }
}