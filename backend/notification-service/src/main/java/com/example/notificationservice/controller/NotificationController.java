package com.example.notificationservice.controller;

import com.example.notificationservice.entity.Notification;
import com.example.notificationservice.repository.NotificationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private static final String ADMIN_TYPE = "ADMIN";

    private final NotificationRepository repository;

    public NotificationController(NotificationRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<Notification> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Notification> getById(@PathVariable Long id) {
        return repository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/admin")
    public List<Notification> getAdminNotifications() {
        return repository.findByRecipientTypeOrderByCreatedAtDesc(ADMIN_TYPE);
    }

    @GetMapping("/admin/unread-count")
    public Map<String, Long> getAdminUnreadCount() {
        long count = repository.countByRecipientTypeAndIsReadFalse(ADMIN_TYPE);
        return Map.of("count", count);
    }

    @GetMapping("/admin/latest")
    public List<Notification> getAdminLatestNotifications(@RequestParam(defaultValue = "10") int limit) {
        List<Notification> all = repository.findByRecipientTypeOrderByCreatedAtDesc(ADMIN_TYPE);
        return all.size() > limit ? all.subList(0, limit) : all;
    }

    @PostMapping("/admin")
    public ResponseEntity<Notification> saveAdminNotification(@RequestBody Map<String, Object> payload) {
        Long orderId = toLong(payload.get("orderId"));
        Long flightId = toLong(payload.get("flightId"));
        String passengerName = String.valueOf(payload.get("passengerName"));
        String customerEmail = String.valueOf(payload.get("customerEmail"));
        Integer quantity = toInt(payload.get("quantity"));
        Double totalAmount = toDouble(payload.get("totalAmount"));
        String status = String.valueOf(payload.get("status"));

        if ("null".equals(passengerName)) passengerName = "Unknown";
        if ("null".equals(customerEmail)) customerEmail = "N/A";
        if ("null".equals(status)) status = "UNKNOWN";

        String message = String.format(
                "[ADMIN ALERT] New booking #%d - Passenger: %s | Flight ID: %d | Seats: %d | Amount: %.0f VND | Status: %s | Customer: %s",
                orderId, passengerName, flightId, quantity, totalAmount, status, customerEmail);

        Notification notification = new Notification(
                orderId,
                flightId,
                message,
                ADMIN_TYPE,
                "admin@flightbooking.com",
                status
        );

        Notification saved = repository.save(notification);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Notification> markAsRead(@PathVariable Long id) {
        return repository.findById(id)
                .map(notification -> {
                    notification.setRead(true);
                    return ResponseEntity.ok(repository.save(notification));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead() {
        List<Notification> unread = repository.findByRecipientTypeAndIsReadFalseOrderByCreatedAtDesc(ADMIN_TYPE);
        unread.forEach(n -> n.setRead(true));
        repository.saveAll(unread);
        return ResponseEntity.ok(Map.of("message", "All notifications marked as read", "count", String.valueOf(unread.size())));
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).longValue();
        try { return Long.parseLong(String.valueOf(value)); } catch (Exception e) { return null; }
    }

    private Integer toInt(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).intValue();
        try { return Integer.parseInt(String.valueOf(value)); } catch (Exception e) { return null; }
    }

    private Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number) return ((Number) value).doubleValue();
        try { return Double.parseDouble(String.valueOf(value)); } catch (Exception e) { return null; }
    }
}