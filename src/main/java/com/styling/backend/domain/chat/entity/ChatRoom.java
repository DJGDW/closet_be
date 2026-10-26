package com.styling.backend.domain.chat.entity;

import com.styling.backend.domain.order.entity.Order;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Entity
@Table(name = "chat_room")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom {

    public static final byte TYPE_PAYMENT = 0;
    public static final byte TYPE_INQUIRY = 1;

    public static final byte STATUS_ACTIVE = 0;
    public static final byte STATUS_CLOSED = 1;
    public static final byte STATUS_EXPIRED = 2;

    private static final long INQUIRY_VALID_HOURS = 24;
    private static final long CLOSED_RETENTION_MONTHS = 3;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_pk")
    private Long roomPk;

    @Column(name = "room_status", nullable = false)
    private Byte roomStatus;

    @Column(name = "room_type", nullable = false)
    private Byte roomType;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Column(name = "delete_after")
    private Instant deleteAfter;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_pk", nullable = false)
    private Stylist stylist;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_pk", unique = true)
    private Order order;

    public ChatRoom(User user, Stylist stylist, Order order) {
        this.user = user;
        this.stylist = stylist;
        this.order = order;
        this.roomType = TYPE_PAYMENT;
        this.roomStatus = STATUS_ACTIVE;
        this.createdAt = Instant.now();
    }

    public static ChatRoom createInquiryRoom(User user, Stylist stylist) {
        ChatRoom room = new ChatRoom();
        Instant now = Instant.now();

        room.user = user;
        room.stylist = stylist;
        room.order = null;
        room.roomType = TYPE_INQUIRY;
        room.roomStatus = STATUS_ACTIVE;
        room.createdAt = now;
        room.expiresAt = now.plus(INQUIRY_VALID_HOURS, ChronoUnit.HOURS);
        room.deleteAfter = room.expiresAt;

        return room;
    }

    public void close() {
        if (this.roomStatus != STATUS_ACTIVE) {
            throw new IllegalStateException("활성 상태의 채팅방만 종료할 수 있습니다.");
        }

        Instant now = Instant.now();
        this.roomStatus = STATUS_CLOSED;
        this.closedAt = now;
        this.deleteAfter = now.plus(CLOSED_RETENTION_MONTHS, ChronoUnit.MONTHS);
    }

    public void expire() {
        if (this.roomType != TYPE_INQUIRY || this.roomStatus != STATUS_ACTIVE) {
            throw new IllegalStateException("활성 상태의 문의 채팅방만 만료할 수 있습니다.");
        }

        this.roomStatus = STATUS_EXPIRED;
        this.closedAt = Instant.now();
    }
}