package com.example.notificationservice.event;

import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {
    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);
    private final NotificationRepository repository;

    public NotificationEventListener(NotificationRepository repository) {
        this.repository = repository;
    }

    @KafkaListener(topics = KafkaTopics.BOOKING_CONFIRMED, groupId = "email-service")
    public void onBookingConfirmed(BookingConfirmedEvent event) {
        String message = String.format("Email sent to %s: booking %d confirmed for flight %d, passenger %s, seats %d, total %.2f",
                event.getCustomerEmail(), event.getOrderId(), event.getFlightId(), event.getPassengerName(), event.getQuantity(), event.getTotalAmount());
        Notification notification = new Notification(event.getOrderId(), message);
        repository.save(notification);
        logger.info("Saved email notification: {}", message);
    }
}
