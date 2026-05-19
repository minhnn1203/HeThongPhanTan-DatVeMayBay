package com.example.productservice.event;

public class InventoryEvent {
    private Long orderId;
    private Long flightId;
    private Integer quantity;
    private String reason;

    public InventoryEvent() {
    }

    public InventoryEvent(Long orderId, Long flightId, Integer quantity, String reason) {
        this.orderId = orderId;
        this.flightId = flightId;
        this.quantity = quantity;
        this.reason = reason;
    }

    public Long getOrderId() {
        return orderId;
    }

    public Long getFlightId() {
        return flightId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public String getReason() {
        return reason;
    }
}
