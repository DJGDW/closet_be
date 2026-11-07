package com.styling.backend.domain.notification.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationUnreadCountResponseDto {

    private Long unreadCount;
}