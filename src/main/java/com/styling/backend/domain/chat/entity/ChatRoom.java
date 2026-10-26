package com.styling.backend.domain.chat.entity;

import com.styling.backend.domain.order.entity.Order;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "chat_room")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatRoom {

    public static final byte STATUS_ACTIVE = 0;
    public static final byte STATUS_CLOSED = 1;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_pk")
    private Long roomPk;

    @Column(name = "room_status")
    private Byte roomStatus;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "closed_at")
    private Instant closedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_pk", nullable = false)
    private Stylist stylist;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_pk", nullable = false, unique = true)
    private Order order;

    public ChatRoom(User user, Stylist stylist, Order order) {
        this.user = user;
        this.stylist = stylist;
        this.order = order;
        this.roomStatus = STATUS_ACTIVE;
        this.createdAt = Instant.now();
    }
}