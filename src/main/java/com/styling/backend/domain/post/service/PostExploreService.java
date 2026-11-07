package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostExploreResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface PostExploreService {

    Page<PostExploreResponseDto> getExplorePosts(
            List<Long> typePks,
            String sort,
            Pageable pageable
    );
}