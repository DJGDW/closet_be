package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostRecommendationResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostRecommendationService {

    Page<PostRecommendationResponseDto> getRecommendedPosts(
            Long userPk,
            Pageable pageable
    );
}