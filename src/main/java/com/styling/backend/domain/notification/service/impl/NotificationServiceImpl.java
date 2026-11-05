package com.styling.backend.domain.notification.service.impl;

import com.styling.backend.domain.notification.dto.NotificationResponseDto;
import com.styling.backend.domain.notification.dto.NotificationUnreadCountResponseDto;
import com.styling.backend.domain.notification.entity.Notification;
import com.styling.backend.domain.notification.mapper.NotificationMapper;
import com.styling.backend.domain.notification.repository.NotificationRepository;
import com.styling.backend.domain.notification.service.NotificationService;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    @Override
    public List<NotificationResponseDto> getNotifications() {
        User user = getLoginUser();

        return notificationRepository
                .findAllByUser_UserPkOrderByCreatedAtDesc(user.getUserPk())
                .stream()
                .map(notificationMapper::toResponseDto)
                .toList();
    }

    @Override
    public NotificationUnreadCountResponseDto getUnreadCount() {
        User user = getLoginUser();

        long unreadCount = notificationRepository
                .countByUser_UserPkAndReadAtIsNull(user.getUserPk());

        return NotificationUnreadCountResponseDto.builder()
                .unreadCount(unreadCount)
                .build();
    }

    @Override
    @Transactional
    public void readNotification(Long notificationPk) {
        User user = getLoginUser();

        Notification notification = notificationRepository
                .findById(notificationPk)
                .orElseThrow(() ->
                        new IllegalArgumentException("존재하지 않는 알림입니다."));

        if (!notification.getUser().getUserPk().equals(user.getUserPk())) {
            throw new IllegalArgumentException("해당 알림에 접근할 권한이 없습니다.");
        }

        notification.markAsRead();
    }

    @Override
    @Transactional
    public void createNotification(
            User recipient,
            User actor,
            Byte notificationType,
            String notificationContent,
            Byte targetType,
            Long targetPk
    ) {
        Notification notification = new Notification(
                recipient,
                actor,
                notificationType,
                notificationContent,
                targetType,
                targetPk
        );

        notificationRepository.save(notification);
    }

    private User getLoginUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        return userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("존재하지 않는 사용자입니다."));
    }
}