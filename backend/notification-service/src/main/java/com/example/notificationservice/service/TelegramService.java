package com.example.notificationservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class TelegramService {
    private static final Logger logger = LoggerFactory.getLogger(TelegramService.class);
    private static final String TG_API_URL = "https://api.telegram.org/bot%s/sendMessage";

    @Value("${telegram.bot-token}")
    private String botToken;

    private final RestTemplate restTemplate;

    public TelegramService() {
        this.restTemplate = new RestTemplate();
    }

    public boolean sendMessage(String chatId, String text) {
        if (chatId == null || chatId.isBlank()) {
            logger.warn("Telegram chatId is null or blank, skipping notification");
            return false;
        }
        if (botToken == null || botToken.isBlank()) {
            logger.warn("Telegram bot token not configured, skipping notification");
            return false;
        }

        try {
            String url = String.format(TG_API_URL, botToken);
            Map<String, Object> payload = Map.of(
                    "chat_id", chatId,
                    "text", text,
                    "parse_mode", "HTML"
            );

            restTemplate.postForEntity(url, payload, String.class);
            logger.info("Telegram message sent to chatId={}", chatId);
            return true;
        } catch (Exception e) {
            logger.error("Failed to send Telegram message to chatId={}: {}", chatId, e.getMessage());
            return false;
        }
    }

    public boolean sendBookingConfirmation(String chatId, Long orderId, Long flightId,
            String passengerName, int quantity, double totalAmount) {
        String text = String.format(
                "✈️ <b>Xác nhận đặt vé thành công!</b>\n\n" +
                "📋 Mã đặt vé: <code>#%d</code>\n" +
                "🔢 Chuyến bay: <code>Flight #%d</code>\n" +
                "👤 Hành khách: %s\n" +
                "🎫 Số lượng: %d vé\n" +
                "💰 Tổng tiền: <b>%,.0f VND</b>\n\n" +
                "Cảm ơn bạn đã sử dụng dịch vụ! Chúc bạn có chuyến bay vui vẻ! 🎉",
                orderId, flightId, passengerName, quantity, totalAmount);
        return sendMessage(chatId, text);
    }
}