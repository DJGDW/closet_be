package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostReactionRequestDto;

public interface PostReactionService {

    void reactToPost(Long postPk, PostReactionRequestDto requestDto);

    void cancelReaction(Long postPk);
}