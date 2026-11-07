package com.styling.backend.domain.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ChatMessageRequestDto {

    @NotBlank(message = "메시지 내용은 필수입니다.")
    @Size(max = 5000, message = "메시지는 5000자 이하로 입력해야 합니다.")
    private String msgContent;
}