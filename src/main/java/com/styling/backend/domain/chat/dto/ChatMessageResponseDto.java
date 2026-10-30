package com.styling.backend.domain.chat.dto;

import com.styling.backend.domain.chat.entity.ChatMessage;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
public class ChatMessageResponseDto {

    private final Long msgPk;
    private final Long senderPk;
    private final String senderNickname;
    private final String senderProfilePic;
    private final Byte msgType;
    private final String msgContent;
    private final Instant sendAt;
    private final Byte isRead;
    private final List<String> imageUrls;

    public ChatMessageResponseDto(ChatMessage message, List<String> imageUrls) {
        this.msgPk = message.getMsgPk();
        this.senderPk = message.getSender().getUserPk();
        this.senderNickname = message.getSender().getNickname();
        this.senderProfilePic = message.getSender().getProfilePic();
        this.msgType = message.getMsgType();
        this.msgContent = message.getMsgContent();
        this.sendAt = message.getSendAt();
        this.isRead = message.getIsRead();
        this.imageUrls = imageUrls;
    }
}