package com.example.orderservice.event;

public final class KafkaTopics {
    public static final String ORDER_CREATED = "order.created";
    public static final String INVENTORY_RESERVED = "inventory.reserved";
    public static final String INVENTORY_FAILED = "inventory.failed";
    public static final String BOOKING_CONFIRMED = "booking.confirmed";
    public static final String ADMIN_NOTIFICATION = "admin.notification";

    private KafkaTopics() {
    }
}
