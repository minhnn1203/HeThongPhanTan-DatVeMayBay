package com.example.notificationservice.repository;

import com.example.notificationservice.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByRecipientTypeOrderByCreatedAtDesc(String recipientType);
    List<Notification> findByRecipientTypeAndIsReadFalseOrderByCreatedAtDesc(String recipientType);
    long countByRecipientTypeAndIsReadFalse(String recipientType);
}
