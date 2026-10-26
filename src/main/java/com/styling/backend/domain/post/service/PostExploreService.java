package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostExploreResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostExploreService {

    Page<PostExploreResponseDto> getExplorePosts(
            Long typePk,
            String sort,
            Pageable pageable
    );
}