package com.styling.backend.domain.chat.dto;

import lombok.Getter;

@Getter
public class VideoCallSignalResponseDto {

    private final Long callPk;
    private final String signalType;
    private final Long senderUserPk;
    private final String signalData;

    public VideoCallSignalResponseDto(
            Long callPk,
            String signalType,
            Long senderUserPk,
            String signalData
    ) {
        this.callPk = callPk;
        this.signalType = signalType;
        this.senderUserPk = senderUserPk;
        this.signalData = signalData;
    }
}