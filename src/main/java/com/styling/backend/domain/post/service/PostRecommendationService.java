package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostRecommendationResponseDto;

import java.util.List;

public interface PostRecommendationService {

    List<PostRecommendationResponseDto> getRecommendedPosts(Long userPk);
}