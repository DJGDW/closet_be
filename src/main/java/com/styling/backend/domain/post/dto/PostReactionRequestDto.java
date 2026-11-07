package com.styling.backend.domain.post.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PostReactionRequestDto {

    @NotNull(message = "반응 유형은 필수입니다.")
    @Min(value = 0, message = "반응 유형은 0 또는 1이어야 합니다.")
    @Max(value = 1, message = "반응 유형은 0 또는 1이어야 합니다.")
    private Integer reactionType;
}