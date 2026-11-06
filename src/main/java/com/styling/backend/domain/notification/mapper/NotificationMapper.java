package com.styling.backend.domain.notification.mapper;

import com.styling.backend.domain.notification.dto.NotificationResponseDto;
import com.styling.backend.domain.notification.entity.Notification;
import org.springframework.stereotype.Component;

@Component
public class NotificationMapper {

    public NotificationResponseDto toResponseDto(Notification notification) {
        return NotificationResponseDto.builder()
                .notificationPk(notification.getNotificationPk())
                .actorUserPk(
                        notification.getActorUser() != null
                                ? notification.getActorUser().getUserPk()
                                : null
                )
                .actorNickname(
                        notification.getActorUser() != null
                                ? notification.getActorUser().getNickname()
                                : null
                )
                .actorProfileImage(
                        notification.getActorUser() != null
                                ? notification.getActorUser().getProfilePic()
                                : null
                )
                .notificationType(notification.getNotificationType())
                .notificationContent(notification.getNotificationContent())
                .targetType(notification.getTargetType())
                .targetPk(notification.getTargetPk())
                .isRead(notification.getReadAt() != null)
                .important(
                        notification.getTargetType() != null
                                && notification.getTargetType() == 2
                )
                .createdAt(notification.getCreatedAt())
                .build();
    }
}