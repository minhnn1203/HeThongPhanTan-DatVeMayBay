package com.example.notificationservice.event;

import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class AdminNotificationListener {
    private static final Logger logger = LoggerFactory.getLogger(AdminNotificationListener.class);
    private static final String RECIPIENT_TYPE = "ADMIN";

    private final NotificationRepository repository;
    private final ObjectMapper objectMapper;

    public AdminNotificationListener(NotificationRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = KafkaTopics.ADMIN_NOTIFICATION, groupId = "notification-service")
    public void onAdminNotification(ConsumerRecord<String, String> record) {
        try {
            AdminNotificationEvent event = objectMapper.readValue(record.value(), AdminNotificationEvent.class);

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
            logger.error("Failed to process admin notification from record: topic={}, partition={}, offset={}, value={}",
                    record.topic(), record.partition(), record.offset(), record.value(), e);
        }
    }
}