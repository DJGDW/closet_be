package com.styling.backend.domain.review.service;

import com.styling.backend.domain.review.dto.ReviewCreateRequestDto;
import com.styling.backend.domain.review.dto.ReviewCreateResponseDto;
import com.styling.backend.domain.review.dto.ReviewListResponseDto;

import java.util.List;

public interface ReviewService {

    ReviewCreateResponseDto createReview(
            Long orderPk,
            ReviewCreateRequestDto request
    );

    List<ReviewListResponseDto> getStylistReviews(Long stylistPk);

    List<ReviewListResponseDto> getMyReviews();

    ReviewCreateResponseDto updateReview(
            Long reviewPk,
            ReviewCreateRequestDto request
    );

    void deleteReview(Long reviewPk);
}