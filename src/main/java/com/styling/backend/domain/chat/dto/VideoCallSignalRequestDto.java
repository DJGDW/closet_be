package com.styling.backend.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class VideoCallSignalRequestDto {

    @NotNull
    private Long callPk;

    @NotBlank
    private String signalType;

    @NotBlank
    private String signalData;
}