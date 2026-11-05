package com.styling.backend.domain.review.service;

import com.styling.backend.domain.review.dto.ReviewCreateRequestDto;
import com.styling.backend.domain.review.dto.ReviewCreateResponseDto;
import com.styling.backend.domain.review.dto.ReviewDetailResponseDto;
import com.styling.backend.domain.review.dto.ReviewListResponseDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ReviewService {

    ReviewCreateResponseDto createReview(
            Long orderPk,
            ReviewCreateRequestDto request,
            List<MultipartFile> images
    );

    List<ReviewListResponseDto> getStylistReviews(Long stylistPk);

    List<ReviewListResponseDto> getMyReviews();

    ReviewDetailResponseDto getReviewDetail(Long reviewPk);

    ReviewCreateResponseDto updateReview(
            Long reviewPk,
            ReviewCreateRequestDto request
    );

    void deleteReview(Long reviewPk);
}