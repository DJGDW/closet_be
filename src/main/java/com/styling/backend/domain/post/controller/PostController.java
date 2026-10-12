package com.styling.backend.domain.post.controller;

import com.styling.backend.domain.post.dto.PostReactionRequestDto;
import com.styling.backend.domain.post.service.PostReactionService;
import com.styling.backend.domain.post.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
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
    private final PostReactionService postReactionService;

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

    @Operation(summary = "게시글 좋아요 또는 싫어요 등록 및 변경")
    @PutMapping("/{postPk}/reaction")
    public ResponseEntity<String> reactToPost(
            @PathVariable Long postPk,
            @Valid @RequestBody PostReactionRequestDto requestDto
    ) {
        postReactionService.reactToPost(postPk, requestDto);
        return ResponseEntity.ok("게시글 반응이 처리되었습니다.");
    }

    @Operation(summary = "게시글 반응 취소")
    @DeleteMapping("/{postPk}/reaction")
    public ResponseEntity<String> cancelReaction(
            @PathVariable Long postPk
    ) {
        postReactionService.cancelReaction(postPk);
        return ResponseEntity.ok("게시글 반응이 취소되었습니다.");
    }
}