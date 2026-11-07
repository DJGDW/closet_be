package com.styling.backend.domain.notification.service;

import com.styling.backend.domain.notification.dto.NotificationResponseDto;
import com.styling.backend.domain.notification.dto.NotificationUnreadCountResponseDto;
import com.styling.backend.domain.user.entity.User;

import java.util.List;

public interface NotificationService {

    List<NotificationResponseDto> getNotifications();

    NotificationUnreadCountResponseDto getUnreadCount();

    void readNotification(Long notificationPk);

    void createNotification(
            User recipient,
            User actor,
            Byte notificationType,
            String notificationContent,
            Byte targetType,
            Long targetPk
    );
}