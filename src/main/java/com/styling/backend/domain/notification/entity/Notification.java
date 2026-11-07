package com.styling.backend.domain.notification.entity;

import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "notification")
@Getter
@NoArgsConstructor
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "notification_pk")
    private Long notificationPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_pk")
    private User actorUser;

    @Column(name = "notification_type", nullable = false)
    private Byte notificationType;

    @Column(name = "notification_content", length = 255, nullable = false)
    private String notificationContent;

    @Column(name = "target_type", nullable = false)
    private Byte targetType;

    @Column(name = "target_pk", nullable = false)
    private Long targetPk;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public Notification(
            User user,
            User actorUser,
            Byte notificationType,
            String notificationContent,
            Byte targetType,
            Long targetPk
    ) {
        this.user = user;
        this.actorUser = actorUser;
        this.notificationType = notificationType;
        this.notificationContent = notificationContent;
        this.targetType = targetType;
        this.targetPk = targetPk;
    }

    @PrePersist
    private void onCreate() {
        this.createdAt = Instant.now();
    }

    public void markAsRead() {
        if (this.readAt == null) {
            this.readAt = Instant.now();
        }
    }
}