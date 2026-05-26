package com.example.notificationservice.event;

import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class NotificationEventListener {
    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);
    private final NotificationRepository repository;
    private final ObjectMapper objectMapper;

    public NotificationEventListener(NotificationRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    @KafkaListener(topics = KafkaTopics.BOOKING_CONFIRMED, groupId = "email-service")
    public void onBookingConfirmed(Map<String, Object> payload) {
        try {
            BookingConfirmedEvent event = objectMapper.convertValue(payload, BookingConfirmedEvent.class);
            String message = String.format("Email sent to %s: booking %d confirmed for flight %d, passenger %s, seats %d, total %.2f",
                    event.getCustomerEmail(), event.getOrderId(), event.getFlightId(), event.getPassengerName(), event.getQuantity(), event.getTotalAmount());
            Notification notification = new Notification(event.getOrderId(), message);
            repository.save(notification);
            logger.info("Saved email notification: {}", message);
        } catch (Exception e) {
            logger.error("Failed to process booking confirmed notification: {}", payload, e);
        }
    }
}