package com.example.notificationservice.event;

import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import com.example.notificationservice.service.TelegramService;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class NotificationEventListener {
    private static final Logger logger = LoggerFactory.getLogger(NotificationEventListener.class);
    private final NotificationRepository repository;
    private final TelegramService telegramService;

    @Value("${telegram.chat-id}")
    private String telegramChatId;

    public NotificationEventListener(NotificationRepository repository, TelegramService telegramService) {
        this.repository = repository;
        this.telegramService = telegramService;
    }

    @KafkaListener(topics = KafkaTopics.BOOKING_CONFIRMED, groupId = "email-service")
    public void onBookingConfirmed(String payload) {
        try {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.registerModule(new JavaTimeModule());
            objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

            BookingConfirmedEvent event = objectMapper.readValue(payload, BookingConfirmedEvent.class);

            // Save notification to DB (was simulating email, now Telegram)
            String message = String.format("Telegram notification sent to %s: booking %d confirmed for flight %d, passenger %s, seats %d, total %.2f",
                    event.getCustomerEmail(), event.getOrderId(), event.getFlightId(), event.getPassengerName(), event.getQuantity(), event.getTotalAmount());
            Notification notification = new Notification(event.getOrderId(), message);
            repository.save(notification);
            logger.info("Saved customer notification: {}", message);

            // Send Telegram message to customer
            sendTelegramNotification(event);
        } catch (Exception e) {
            logger.error("Failed to process booking confirmed notification from topic='{}': {}",
                    KafkaTopics.BOOKING_CONFIRMED, e.getMessage());
        }
    }

    private void sendTelegramNotification(BookingConfirmedEvent event) {
        try {
            boolean sent = telegramService.sendBookingConfirmation(
                    telegramChatId,
                    event.getOrderId(),
                    event.getFlightId(),
                    event.getPassengerName(),
                    event.getQuantity(),
                    event.getTotalAmount()
            );
            if (sent) {
                logger.info("Telegram notification sent to shared chatId={} for userId={}",
                        telegramChatId, event.getUserId());
            }
        } catch (Exception e) {
            logger.warn("Failed to send Telegram notification to userId={}: {}", event.getUserId(), e.getMessage());
        }
    }
}
