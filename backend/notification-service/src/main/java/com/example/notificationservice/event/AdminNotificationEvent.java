package com.example.notificationservice.event;

import java.time.LocalDateTime;

public class AdminNotificationEvent {
    private Long orderId;
    private Long flightId;
    private String passengerName;
    private String customerEmail;
    private Integer quantity;
    private Double totalAmount;
    private String status;
    private LocalDateTime timestamp;

    public AdminNotificationEvent() {
    }

    public Long getOrderId() { return orderId; }
    public Long getFlightId() { return flightId; }
    public String getPassengerName() { return passengerName; }
    public String getCustomerEmail() { return customerEmail; }
    public Integer getQuantity() { return quantity; }
    public Double getTotalAmount() { return totalAmount; }
    public String getStatus() { return status; }
    public LocalDateTime getTimestamp() { return timestamp; }
}