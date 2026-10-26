package com.styling.backend.domain.chat.controller;

import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
}