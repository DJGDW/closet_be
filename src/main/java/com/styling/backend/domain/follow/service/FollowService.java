package com.styling.backend.domain.follow.service;

import com.styling.backend.domain.follow.dto.FollowResponseDto;
import com.styling.backend.domain.follow.dto.FollowerResponseDto;

import java.util.List;

public interface FollowService {

    void followStylist(Long stylistPk);

    void unfollowStylist(Long stylistPk);

    List<FollowResponseDto> getFollowings();

    List<FollowerResponseDto> getFollowers();
}