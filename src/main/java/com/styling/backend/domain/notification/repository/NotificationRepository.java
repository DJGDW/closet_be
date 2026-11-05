package com.styling.backend.domain.notification.repository;

import com.styling.backend.domain.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findAllByUser_UserPkOrderByCreatedAtDesc(Long userPk);

    long countByUser_UserPkAndReadAtIsNull(Long userPk);
}