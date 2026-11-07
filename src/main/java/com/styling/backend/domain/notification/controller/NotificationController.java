package com.styling.backend.domain.notification.controller;

import com.styling.backend.domain.notification.dto.NotificationResponseDto;
import com.styling.backend.domain.notification.dto.NotificationUnreadCountResponseDto;
import com.styling.backend.domain.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notification")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @Operation(summary = "내 알림 목록 조회")
    @GetMapping
    public ResponseEntity<List<NotificationResponseDto>> getNotifications() {
        return ResponseEntity.ok(
                notificationService.getNotifications()
        );
    }

    @Operation(summary = "읽지 않은 알림 개수 조회")
    @GetMapping("/unread-count")
    public ResponseEntity<NotificationUnreadCountResponseDto> getUnreadCount() {
        return ResponseEntity.ok(
                notificationService.getUnreadCount()
        );
    }

    @Operation(summary = "알림 읽음 처리")
    @PatchMapping("/{notificationPk}/read")
    public ResponseEntity<String> readNotification(
            @PathVariable Long notificationPk
    ) {
        notificationService.readNotification(notificationPk);

        return ResponseEntity.ok("알림을 읽음 처리했습니다.");
    }
}