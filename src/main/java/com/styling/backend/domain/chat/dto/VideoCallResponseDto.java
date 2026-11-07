package com.styling.backend.domain.chat.dto;

import com.styling.backend.domain.chat.entity.VideoCall;
import lombok.Getter;

import java.time.Instant;

@Getter
public class VideoCallResponseDto {

    private final Long callPk;
    private final Long roomPk;
    private final Long initiatorUserPk;
    private final Byte callType;
    private final Byte callStatus;
    private final Instant createdAt;
    private final Instant startedAt;
    private final Instant endedAt;

    public VideoCallResponseDto(VideoCall videoCall) {
        this.callPk = videoCall.getCallPk();
        this.roomPk = videoCall.getChatRoom().getRoomPk();
        this.initiatorUserPk = videoCall.getInitiator().getUserPk();
        this.callType = videoCall.getCallType();
        this.callStatus = videoCall.getCallStatus();
        this.createdAt = videoCall.getCreatedAt();
        this.startedAt = videoCall.getStartedAt();
        this.endedAt = videoCall.getEndedAt();
    }
}