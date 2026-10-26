package com.styling.backend.domain.post.controller;

import com.styling.backend.domain.post.dto.PostExploreResponseDto;
import com.styling.backend.domain.post.service.PostExploreService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/post/explore")
@RequiredArgsConstructor
public class PostExploreController {

    private final PostExploreService postExploreService;

    @Operation(summary = "탐색 게시글 조회")
    @GetMapping
    public ResponseEntity<Page<PostExploreResponseDto>> getExplorePosts(
            @RequestParam(required = false) Long typePk,
            @RequestParam(defaultValue = "LATEST") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        if (page < 0 || size < 1 || size > 50) {
            return ResponseEntity.badRequest().build();
        }

        if (!sort.equalsIgnoreCase("LATEST")
                && !sort.equalsIgnoreCase("LIKES")) {
            return ResponseEntity.badRequest().build();
        }

        Pageable pageable = PageRequest.of(page, size);

        Page<PostExploreResponseDto> posts =
                postExploreService.getExplorePosts(
                        typePk,
                        sort,
                        pageable
                );

        return ResponseEntity.ok(posts);
    }
}