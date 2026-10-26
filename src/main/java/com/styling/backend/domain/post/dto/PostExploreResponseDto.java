package com.styling.backend.domain.post.dto;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class PostExploreResponseDto {

    private Long postPk;
    private String imageUrl;

    private String styleName;
    private String ratioType;

    private Long stylistPk;
    private String stylistNickname;
    private BigDecimal stylistRating;

    private Integer viewCount;
    private Long likeCount;
}