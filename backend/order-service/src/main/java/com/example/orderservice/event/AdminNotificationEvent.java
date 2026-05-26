package com.example.orderservice.event;

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

    public AdminNotificationEvent(Long orderId, Long flightId, String passengerName,
            String customerEmail, Integer quantity, Double totalAmount, String status) {
        this.orderId = orderId;
        this.flightId = flightId;
        this.passengerName = passengerName;
        this.customerEmail = customerEmail;
        this.quantity = quantity;
        this.totalAmount = totalAmount;
        this.status = status;
        this.timestamp = LocalDateTime.now();
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