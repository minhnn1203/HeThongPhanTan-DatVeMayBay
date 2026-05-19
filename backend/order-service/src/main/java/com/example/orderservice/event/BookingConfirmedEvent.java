package com.example.orderservice.event;

public class BookingConfirmedEvent {
    private Long orderId;
    private Long userId;
    private Long flightId;
    private Integer quantity;
    private String customerEmail;
    private String passengerName;
    private Double totalAmount;

    public BookingConfirmedEvent() {
    }

    public BookingConfirmedEvent(Long orderId, Long userId, Long flightId, Integer quantity, String customerEmail, String passengerName, Double totalAmount) {
        this.orderId = orderId;
        this.userId = userId;
        this.flightId = flightId;
        this.quantity = quantity;
        this.customerEmail = customerEmail;
        this.passengerName = passengerName;
        this.totalAmount = totalAmount;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Long getUserId() {
        return userId;
    }

    public Long getFlightId() {
        return flightId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public String getPassengerName() {
        return passengerName;
    }

    public Double getTotalAmount() {
        return totalAmount;
    }
}
