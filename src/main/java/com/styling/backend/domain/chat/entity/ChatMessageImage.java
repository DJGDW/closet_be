package com.styling.backend.domain.chat.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(
    name = "chat_message_image",
    indexes = {
        @Index(
            name = "idx_chat_message_image_msg_order",
            columnList = "msg_pk, display_order"
        )
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChatMessageImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_pk")
    private Long imagePk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "msg_pk", nullable = false)
    private ChatMessage chatMessage;

    @Column(name = "image_url", nullable = false, length = 2048)
    private String imageUrl;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public ChatMessageImage(
            ChatMessage chatMessage,
            String imageUrl,
            Integer displayOrder
    ) {
        this.chatMessage = chatMessage;
        this.imageUrl = imageUrl;
        this.displayOrder = displayOrder;
        this.createdAt = Instant.now();
    }
}