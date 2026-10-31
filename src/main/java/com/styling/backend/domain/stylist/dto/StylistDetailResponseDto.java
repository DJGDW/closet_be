package com.styling.backend.domain.stylist.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@AllArgsConstructor
public class StylistDetailResponseDto {

    private String nickname;
    private String profilePic;
    private String introduction;
    private BigDecimal rating;
    private String locationName;
    private List<StyleTypeDto> styleTypes;
    private List<PlanDto> plans;
    private Long postCount;
    private Long followerCount;

    @Getter
    @AllArgsConstructor
    public static class StyleTypeDto {
        private Long typePk;
        private String styleName;
        private String styleCode;
    }

    @Getter
    @AllArgsConstructor
    public static class PlanDto {
        private Integer planPk;
        private String planTier;
        private String planCode;
        private String description;
        private Integer price;
    }
}