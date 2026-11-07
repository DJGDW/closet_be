package com.styling.backend.domain.notification.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class NotificationResponseDto {

    private Long notificationPk;
    private Long actorUserPk;
    private String actorNickname;
    private String actorProfileImage;
    private Byte notificationType;
    private String notificationContent;
    private Byte targetType;
    private Long targetPk;
    private boolean isRead;
    private boolean important;
    private Instant createdAt;
}