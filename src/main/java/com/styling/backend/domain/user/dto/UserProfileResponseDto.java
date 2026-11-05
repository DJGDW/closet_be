package com.styling.backend.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Getter
@AllArgsConstructor
public class UserProfileResponseDto {

    private Long userPk;
    private String userId;
    private String userName;
    private String nickname;
    private String phoneNumber;
    private LocalDate birthDate;
    private String email;
    private Integer gender;
    private String profilePic;
    private Integer role;
    private Instant createdAt;

    private UserBodyInfo body;
    private List<StyleTypeInfo> styleTypes;

    @Getter
    @AllArgsConstructor
    public static class UserBodyInfo {

        private Integer tall;
        private BigDecimal weight;
        private Integer chestSize;
        private Integer waistSize;
        private Integer shoulderWidth;
        private Integer hips;
        private Integer thigh;
        private Integer calf;
        private Integer leg;

        private UserBodyRatioInfo ratios;
    }

    @Getter
    @AllArgsConstructor
    public static class UserBodyRatioInfo {

        private Float shoulderRatio;
        private Float bellyRatio;
        private Float thighRatio;
        private Float calfRatio;
        private Float legRatio;
    }

    @Getter
    @AllArgsConstructor
    public static class StyleTypeInfo {

        private Long typePk;
        private String styleName;
        private String styleCode;
    }
}