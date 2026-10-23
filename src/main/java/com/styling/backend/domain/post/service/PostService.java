package com.styling.backend.domain.post.service;

import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PostService {

    void createPost(
            MultipartFile image,
            Long typePk,
            Long ratioPk,
            List<String> hashtags
    );
}