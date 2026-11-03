package com.styling.backend.domain.review.controller;

import com.styling.backend.domain.review.dto.ReviewCreateRequestDto;
import com.styling.backend.domain.review.dto.ReviewCreateResponseDto;
import com.styling.backend.domain.review.dto.ReviewListResponseDto;
import com.styling.backend.domain.review.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @Operation(
            summary = "리뷰 작성",
            description = "서비스가 최종 완료된 주문에 대해 구매자가 여러 장의 사진과 함께 리뷰를 작성합니다."
    )
    @PostMapping(value = "/{orderPk}", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewCreateResponseDto createReview(
            @PathVariable Long orderPk,
            @Valid @RequestPart("request") ReviewCreateRequestDto request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images
    ) {
        return reviewService.createReview(orderPk, request, images);
    }

    @Operation(
            summary = "스타일리스트 리뷰 목록 조회",
            description = "특정 스타일리스트가 받은 리뷰를 최신순으로 조회합니다."
    )
    @GetMapping("/stylist/{stylistPk}")
    public List<ReviewListResponseDto> getStylistReviews(
            @PathVariable Long stylistPk
    ) {
        return reviewService.getStylistReviews(stylistPk);
    }

    @Operation(
            summary = "내가 작성한 리뷰 목록 조회",
            description = "현재 로그인한 사용자가 작성한 리뷰를 최신순으로 조회합니다."
    )
    @GetMapping("/me")
    public List<ReviewListResponseDto> getMyReviews() {
        return reviewService.getMyReviews();
    }

    @Operation(
            summary = "리뷰 수정",
            description = "현재 로그인한 사용자가 작성한 리뷰의 별점과 내용을 수정합니다."
    )
    @PutMapping("/{reviewPk}")
    public ReviewCreateResponseDto updateReview(
            @PathVariable Long reviewPk,
            @Valid @RequestBody ReviewCreateRequestDto request
    ) {
        return reviewService.updateReview(reviewPk, request);
    }

    @Operation(
            summary = "리뷰 삭제",
            description = "현재 로그인한 사용자가 작성한 리뷰를 삭제하고 스타일리스트 평균 평점을 갱신합니다."
    )
    @DeleteMapping("/{reviewPk}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReview(
            @PathVariable Long reviewPk
    ) {
        reviewService.deleteReview(reviewPk);
    }
}