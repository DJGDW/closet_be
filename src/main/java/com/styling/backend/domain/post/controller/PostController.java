package com.styling.backend.domain.post.controller;

import com.styling.backend.domain.post.dto.PostReactionCountResponseDto;
import com.styling.backend.domain.post.dto.PostReactionRequestDto;
import com.styling.backend.domain.post.dto.PostRecommendationResponseDto;
import com.styling.backend.domain.post.service.PostReactionService;
import com.styling.backend.domain.post.service.PostRecommendationService;
import com.styling.backend.domain.post.service.PostService;
import com.styling.backend.domain.post.service.PostViewService;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/post")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final PostReactionService postReactionService;
    private final PostViewService postViewService;
    private final PostRecommendationService postRecommendationService;
    private final UserRepository userRepository;

    @Operation(summary = "게시글 작성")
    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<String> createPost(
            @RequestPart("image") MultipartFile image,
            @RequestParam("typePk") Long typePk,
            @RequestParam("ratioPk") Long ratioPk,
            @RequestParam(value = "hashtags", required = false)
            List<String> hashtags
    ) {
        postService.createPost(image, typePk, ratioPk, hashtags);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body("게시글이 등록되었습니다.");
    }

    @Operation(summary = "추천 게시글 목록 조회")
    @GetMapping("/recommended")
    public ResponseEntity<List<PostRecommendationResponseDto>>
    getRecommendedPosts() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        List<PostRecommendationResponseDto> posts =
                postRecommendationService.getRecommendedPosts(
                        user.getUserPk()
                );

        return ResponseEntity.ok(posts);
    }

    @Operation(summary = "게시글 조회 기록 등록 및 조회수 증가")
    @PostMapping("/{postPk}/view")
    public ResponseEntity<String> recordPostView(
            @PathVariable Long postPk
    ) {
        String message = postViewService.recordPostView(postPk);
        return ResponseEntity.ok(message);
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

    @Operation(summary = "게시글 좋아요 및 싫어요 개수 조회")
    @GetMapping("/{postPk}/reaction")
    public ResponseEntity<PostReactionCountResponseDto> getReactionCount(
            @PathVariable Long postPk
    ) {
        return ResponseEntity.ok(
                postReactionService.getReactionCount(postPk)
        );
    }
}