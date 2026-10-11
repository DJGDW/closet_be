package com.styling.backend.domain.follow.dto.response;

import com.styling.backend.domain.stylist.entity.Stylist;
import lombok.Getter;

@Getter
public class FollowResponseDto {

    private final Long stylistPk;
    private final String userName;
    private final String nickname;
    private final String profilePic;

    public FollowResponseDto(Stylist stylist) {
        this.stylistPk = stylist.getStylistPk();
        this.userName = stylist.getUser().getUserName();
        this.nickname = stylist.getUser().getNickname();
        this.profilePic = stylist.getUser().getProfilePic();
    }
}