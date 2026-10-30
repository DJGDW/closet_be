package com.styling.backend.domain.chat.entity;

import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(
    name = "video_call",
    indexes = {
        @Index(
            name = "idx_video_call_room_created",
            columnList = "room_pk, created_at"
        )
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VideoCall {

    public static final byte TYPE_VIDEO = 1;

    public static final byte STATUS_REQUESTED = 0;
    public static final byte STATUS_ACCEPTED = 1;
    public static final byte STATUS_REJECTED = 2;
    public static final byte STATUS_ENDED = 3;
    public static final byte STATUS_MISSED = 4;
    public static final byte STATUS_CANCELED = 5;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "call_pk")
    private Long callPk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_pk", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "initiator_user_pk", nullable = false)
    private User initiator;

    @Column(name = "call_type", nullable = false)
    private Byte callType;

    @Column(name = "call_status", nullable = false)
    private Byte callStatus;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    public VideoCall(ChatRoom chatRoom, User initiator) {
        this.chatRoom = chatRoom;
        this.initiator = initiator;
        this.callType = TYPE_VIDEO;
        this.callStatus = STATUS_REQUESTED;
        this.createdAt = Instant.now();
    }

    public void accept() {
        this.callStatus = STATUS_ACCEPTED;
        this.startedAt = Instant.now();
    }

    public void reject() {
        this.callStatus = STATUS_REJECTED;
        this.endedAt = Instant.now();
    }

    public void end() {
        this.callStatus = STATUS_ENDED;
        this.endedAt = Instant.now();
    }

    public void miss() {
        this.callStatus = STATUS_MISSED;
        this.endedAt = Instant.now();
    }

    public void cancel() {
        this.callStatus = STATUS_CANCELED;
        this.endedAt = Instant.now();
    }
}