package com.styling.backend.domain.chat.controller;

import com.styling.backend.domain.chat.dto.VideoCallResponseDto;
import com.styling.backend.domain.chat.entity.VideoCall;
import com.styling.backend.domain.chat.service.VideoCallService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/chat/{roomPk}/video-call")
@RequiredArgsConstructor
public class VideoCallController {

    private final VideoCallService videoCallService;

    @Operation(summary = "영상 통화 요청")
    @PostMapping
    public ResponseEntity<VideoCallResponseDto> requestCall(
            @PathVariable Long roomPk
    ) {
        VideoCall videoCall = videoCallService.requestCall(roomPk);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(new VideoCallResponseDto(videoCall));
    }

    @Operation(summary = "영상 통화 수락")
    @PatchMapping("/{callPk}/accept")
    public ResponseEntity<VideoCallResponseDto> acceptCall(
            @PathVariable Long roomPk,
            @PathVariable Long callPk
    ) {
        VideoCall videoCall = videoCallService.acceptCall(roomPk, callPk);
        return ResponseEntity.ok(new VideoCallResponseDto(videoCall));
    }

    @Operation(summary = "영상 통화 거절")
    @PatchMapping("/{callPk}/reject")
    public ResponseEntity<VideoCallResponseDto> rejectCall(
            @PathVariable Long roomPk,
            @PathVariable Long callPk
    ) {
        VideoCall videoCall = videoCallService.rejectCall(roomPk, callPk);
        return ResponseEntity.ok(new VideoCallResponseDto(videoCall));
    }

    @Operation(summary = "영상 통화 요청 취소")
    @PatchMapping("/{callPk}/cancel")
    public ResponseEntity<VideoCallResponseDto> cancelCall(
            @PathVariable Long roomPk,
            @PathVariable Long callPk
    ) {
        VideoCall videoCall = videoCallService.cancelCall(roomPk, callPk);
        return ResponseEntity.ok(new VideoCallResponseDto(videoCall));
    }

    @Operation(summary = "영상 통화 종료")
    @PatchMapping("/{callPk}/end")
    public ResponseEntity<VideoCallResponseDto> endCall(
            @PathVariable Long roomPk,
            @PathVariable Long callPk
    ) {
        VideoCall videoCall = videoCallService.endCall(roomPk, callPk);
        return ResponseEntity.ok(new VideoCallResponseDto(videoCall));
    }
}