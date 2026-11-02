package com.styling.backend.domain.follow.dto;

import com.styling.backend.domain.user.entity.User;
import lombok.Getter;

@Getter
public class FollowerResponseDto {

    private final Long userPk;
    private final String userName;
    private final String nickname;
    private final String profilePic;

    public FollowerResponseDto(User user) {
        this.userPk = user.getUserPk();
        this.userName = user.getUserName();
        this.nickname = user.getNickname();
        this.profilePic = user.getProfilePic();
    }
}