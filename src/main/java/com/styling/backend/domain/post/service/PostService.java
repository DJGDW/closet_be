package com.styling.backend.domain.post.service;

import com.styling.backend.domain.post.dto.PostExploreResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {

    void createPost(
            MultipartFile image,
            Long typePk,
            Long ratioPk,
            List<String> hashtags
    );

    void updatePost(
            Long postPk,
            MultipartFile image,
            Long typePk,
            Long ratioPk,
            List<String> hashtags
    );

    Page<PostExploreResponseDto> getMyPosts(Pageable pageable);

    Page<PostExploreResponseDto> getStylistPosts(
            Long stylistPk,
            Pageable pageable
    );
}