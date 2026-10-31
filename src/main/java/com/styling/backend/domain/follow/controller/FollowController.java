package com.styling.backend.domain.follow.controller;

import com.styling.backend.domain.follow.dto.FollowResponseDto;
import com.styling.backend.domain.follow.service.FollowService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;

    @Operation(summary = "스타일리스트 팔로우")
    @PostMapping("/{stylistPk}")
    public ResponseEntity<Void> followStylist(@PathVariable Long stylistPk) {
        followService.followStylist(stylistPk);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "스타일리스트 팔로우 취소")
    @DeleteMapping("/{stylistPk}")
    public ResponseEntity<Void> unfollowStylist(@PathVariable Long stylistPk) {
        followService.unfollowStylist(stylistPk);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "내가 팔로우한 스타일리스트 목록 조회")
    @GetMapping
    public ResponseEntity<List<FollowResponseDto>> getFollowings() {
        return ResponseEntity.ok(followService.getFollowings());
    }
}