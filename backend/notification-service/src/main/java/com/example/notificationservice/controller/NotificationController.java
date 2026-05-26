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
}
