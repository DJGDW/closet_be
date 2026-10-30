package com.styling.backend.domain.chat.service;

import com.styling.backend.domain.chat.dto.ChatMessageResponseDto;
import com.styling.backend.domain.chat.entity.ChatMessage;
import com.styling.backend.domain.chat.entity.ChatRoom;

import java.util.List;

public interface ChatService {

    ChatRoom createInquiryRoom(Long stylistPk);

    ChatMessage sendTextMessage(Long roomPk, String msgContent);

    List<ChatMessageResponseDto> getMessages(Long roomPk);

    void markMessagesAsRead(Long roomPk);
}