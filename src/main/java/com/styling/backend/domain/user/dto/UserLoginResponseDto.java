package com.styling.backend.domain.user.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserLoginResponseDto {

    private String accessToken;
    private String tokenType;
    private long expiresIn;
    private Long userPk;
    private String userId;
    private String nickname;
}