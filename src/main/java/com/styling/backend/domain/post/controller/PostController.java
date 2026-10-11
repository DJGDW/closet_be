package com.styling.backend.domain.post.controller;

import com.styling.backend.domain.post.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/post")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    @Operation(summary = "게시글 작성")
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<String> createPost(
            @RequestPart("image") MultipartFile image,
            @RequestParam(value = "hashtags", required = false) List<String> hashtags
    ) {
        postService.createPost(image, hashtags);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("게시글이 등록되었습니다.");
    }
}