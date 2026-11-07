package com.styling.backend.domain.post.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class PostDetailResponseDto {

    private String profileImage;
    private String stylistNickname;
    private String imageUrl;
    private Long likeCount;
    private String styleName;
    private List<String> hashtags;
    private String ratioType;
}