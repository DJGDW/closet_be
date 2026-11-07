package com.styling.backend.domain.chat.controller;

import com.styling.backend.domain.chat.dto.ChatMessageResponseDto;
import com.styling.backend.domain.chat.dto.VideoCallSignalRequestDto;
import com.styling.backend.domain.chat.entity.ChatMessage;
import com.styling.backend.domain.chat.repository.ChatMessageImageRepository;
import com.styling.backend.domain.chat.service.ChatService;
import com.styling.backend.domain.chat.service.VideoCallService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final ChatMessageImageRepository chatMessageImageRepository;
    private final VideoCallService videoCallService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat/{roomPk}/message")
    @Transactional
    public void sendMessage(
            @DestinationVariable Long roomPk,
            String msgContent,
            Authentication authentication
    ) {
        ChatMessage message = chatService.sendTextMessage(roomPk, msgContent);

        List<String> imageUrls =
                chatMessageImageRepository
                        .findByChatMessage_MsgPkOrderByDisplayOrderAsc(
                                message.getMsgPk()
                        )
                        .stream()
                        .map(image -> image.getImageUrl())
                        .toList();

        ChatMessageResponseDto response =
                new ChatMessageResponseDto(message, imageUrls);

        messagingTemplate.convertAndSend(
                "/topic/chat/" + roomPk,
                response
        );
    }

    @MessageMapping("/chat/{roomPk}/video-call")
    public void sendVideoCallSignal(
            @DestinationVariable Long roomPk,
            VideoCallSignalRequestDto requestDto
    ) {
        videoCallService.sendSignal(roomPk, requestDto);
    }
}