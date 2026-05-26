package com.example.notificationservice.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "NOTIFICATIONS")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long orderId;
    private Long flightId;
    private String message;
    private String recipientType;
    private String recipientEmail;
    private String status;
    private LocalDateTime createdAt;
    private boolean isRead;

    public Notification() {
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public Notification(Long orderId, String message) {
        this.orderId = orderId;
        this.message = message;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public Notification(Long orderId, Long flightId, String message, String recipientType,
            String recipientEmail, String status) {
        this.orderId = orderId;
        this.flightId = flightId;
        this.message = message;
        this.recipientType = recipientType;
        this.recipientEmail = recipientEmail;
        this.status = status;
        this.createdAt = LocalDateTime.now();
        this.isRead = false;
    }

    public Long getId() { return id; }
    public Long getOrderId() { return orderId; }
    public Long getFlightId() { return flightId; }
    public String getMessage() { return message; }
    public String getRecipientType() { return recipientType; }
    public String getRecipientEmail() { return recipientEmail; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }
}
