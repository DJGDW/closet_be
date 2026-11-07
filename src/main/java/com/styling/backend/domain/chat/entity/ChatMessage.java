package com.styling.backend.domain.chat.entity;

import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(
    name = "chat_message",
    indexes = {
        @Index(
            name = "idx_chat_message_room_send",
            columnList = "room_pk, send_at, msg_pk"
        )
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessage {

    public static final byte TYPE_TEXT = 0;
    public static final byte TYPE_IMAGE = 1;
    public static final byte TYPE_SYSTEM = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "msg_pk")
    private Long msgPk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_pk", nullable = false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User sender;

    @Column(name = "msg_type")
    private Byte msgType;

    @Column(name = "msg_content", columnDefinition = "TEXT")
    private String msgContent;

    @Column(name = "send_at", nullable = false, updatable = false)
    private Instant sendAt;

    @Column(name = "is_read", nullable = false)
    private Byte isRead;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    public ChatMessage(ChatRoom chatRoom, User sender, byte msgType, String msgContent) {
        this.chatRoom = chatRoom;
        this.sender = sender;
        this.msgType = msgType;
        this.msgContent = msgContent;
        this.sendAt = Instant.now();
        this.isRead = (byte) 0;
    }

    public void markAsRead() {
        if (this.isRead == 0) {
            this.isRead = 1;
            this.readAt = Instant.now();
        }
    }

    public void updateContent(String msgContent) {
        if (this.deletedAt != null) {
            throw new IllegalStateException("삭제된 메시지는 수정할 수 없습니다.");
        }

        this.msgContent = msgContent;
        this.updatedAt = Instant.now();
    }

    public void delete() {
        if (this.deletedAt == null) {
            this.deletedAt = Instant.now();
            this.msgContent = null;
        }
    }
}