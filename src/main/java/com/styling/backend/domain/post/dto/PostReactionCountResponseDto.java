package com.styling.backend.domain.post.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PostReactionCountResponseDto {

    private long likeCount;
    private long dislikeCount;
}