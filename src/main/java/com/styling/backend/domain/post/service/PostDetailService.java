package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostDetailResponseDto;

public interface PostDetailService {

    PostDetailResponseDto getPostDetail(Long postPk);
}