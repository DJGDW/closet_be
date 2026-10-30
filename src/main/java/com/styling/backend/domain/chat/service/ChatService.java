package com.styling.backend.domain.chat.service;

import com.styling.backend.domain.chat.dto.ChatMessageResponseDto;
import com.styling.backend.domain.chat.dto.ChatRoomListResponseDto;
import com.styling.backend.domain.chat.entity.ChatMessage;
import com.styling.backend.domain.chat.entity.ChatRoom;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ChatService {

    ChatRoom createInquiryRoom(Long stylistPk);

    ChatMessage sendTextMessage(Long roomPk, String msgContent);

    ChatMessage sendImageMessage(Long roomPk, List<MultipartFile> images);

    List<ChatMessageResponseDto> getMessages(Long roomPk);

    void markMessagesAsRead(Long roomPk);

    List<ChatRoomListResponseDto> getActiveChatRooms();

    List<ChatRoomListResponseDto> getClosedChatRooms();
}