package com.styling.backend.domain.chat.controller;

import com.styling.backend.domain.chat.dto.ChatMessageRequestDto;
import com.styling.backend.domain.chat.dto.ChatMessageResponseDto;
import com.styling.backend.domain.chat.dto.ChatRoomListResponseDto;
import com.styling.backend.domain.chat.entity.ChatMessage;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @Operation(summary = "문의 채팅방 생성 또는 기존 채팅방 조회")
    @PostMapping("/inquiry/{stylistPk}")
    public ResponseEntity<Long> createInquiryRoom(
            @PathVariable Long stylistPk
    ) {
        ChatRoom chatRoom = chatService.createInquiryRoom(stylistPk);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(chatRoom.getRoomPk());
    }

    @Operation(summary = "채팅 메시지 전송")
    @PostMapping("/{roomPk}/message")
    public ResponseEntity<Long> sendTextMessage(
            @PathVariable Long roomPk,
            @Valid @RequestBody ChatMessageRequestDto requestDto
    ) {
        ChatMessage message = chatService.sendTextMessage(
                roomPk,
                requestDto.getMsgContent()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(message.getMsgPk());
    }

    @Operation(summary = "채팅 이미지 메시지 전송")
    @PostMapping(
            value = "/{roomPk}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Long> sendImageMessage(
            @PathVariable Long roomPk,
            @RequestParam("images") List<MultipartFile> images
    ) {
        ChatMessage message = chatService.sendImageMessage(roomPk, images);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(message.getMsgPk());
    }

    @Operation(summary = "채팅 메시지 목록 조회")
    @GetMapping("/{roomPk}/messages")
    public ResponseEntity<List<ChatMessageResponseDto>> getMessages(
            @PathVariable Long roomPk
    ) {
        return ResponseEntity.ok(chatService.getMessages(roomPk));
    }

    @Operation(summary = "채팅 메시지 읽음 처리")
    @PatchMapping("/{roomPk}/read")
    public ResponseEntity<Void> markMessagesAsRead(
            @PathVariable Long roomPk
    ) {
        chatService.markMessagesAsRead(roomPk);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "활성 채팅방 목록 조회")
    @GetMapping("/rooms")
    public ResponseEntity<List<ChatRoomListResponseDto>> getActiveChatRooms() {
        return ResponseEntity.ok(chatService.getActiveChatRooms());
    }

    @Operation(summary = "종료된 채팅방 목록 조회")
    @GetMapping("/rooms/history")
    public ResponseEntity<List<ChatRoomListResponseDto>> getClosedChatRooms() {
        return ResponseEntity.ok(chatService.getClosedChatRooms());
    }
}