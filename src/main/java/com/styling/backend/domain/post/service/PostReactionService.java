package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostReactionCountResponseDto;
import com.styling.backend.domain.post.dto.PostReactionRequestDto;
import com.styling.backend.domain.post.dto.PostRecommendationResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostReactionService {

    void reactToPost(Long postPk, PostReactionRequestDto requestDto);

    void cancelReaction(Long postPk);

    PostReactionCountResponseDto getReactionCount(Long postPk);

    Page<PostRecommendationResponseDto> getLikedPosts(Pageable pageable);
}