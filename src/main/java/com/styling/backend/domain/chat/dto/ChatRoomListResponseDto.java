package com.styling.backend.domain.chat.dto;

import com.styling.backend.domain.chat.entity.ChatMessage;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.user.entity.User;
import lombok.Getter;

import java.time.Instant;

@Getter
public class ChatRoomListResponseDto {

    private final Long roomPk;
    private final String opponentNickname;
    private final String opponentProfilePic;
    private final String lastMessage;
    private final Byte lastMessageType;
    private final Instant lastMessageAt;
    private final Long unreadCount;
    private final Byte roomType;
    private final Byte roomStatus;

    public ChatRoomListResponseDto(
            ChatRoom chatRoom,
            User opponent,
            ChatMessage lastMessage,
            Long unreadCount
    ) {
        this.roomPk = chatRoom.getRoomPk();
        this.opponentNickname = opponent.getNickname();
        this.opponentProfilePic = opponent.getProfilePic();
        this.lastMessage = lastMessage != null
                ? lastMessage.getMsgContent()
                : null;
        this.lastMessageType = lastMessage != null
                ? lastMessage.getMsgType()
                : null;
        this.lastMessageAt = lastMessage != null
                ? lastMessage.getSendAt()
                : null;
        this.unreadCount = unreadCount;
        this.roomType = chatRoom.getRoomType();
        this.roomStatus = chatRoom.getRoomStatus();
    }
}