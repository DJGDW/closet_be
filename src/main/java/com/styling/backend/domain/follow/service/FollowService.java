package com.styling.backend.domain.follow.service;

import com.styling.backend.domain.follow.dto.response.FollowResponseDto;

import java.util.List;

public interface FollowService {

    void followStylist(Long stylistPk);

    void unfollowStylist(Long stylistPk);

    List<FollowResponseDto> getFollowings();
}