package com.styling.backend.domain.review.service.impl;

import com.styling.backend.domain.global.image.ImageService;
import com.styling.backend.domain.order.entity.Order;
import com.styling.backend.domain.order.repository.OrderRepository;
import com.styling.backend.domain.review.dto.ReviewCreateRequestDto;
import com.styling.backend.domain.review.dto.ReviewCreateResponseDto;
import com.styling.backend.domain.review.dto.ReviewDetailResponseDto;
import com.styling.backend.domain.review.dto.ReviewListResponseDto;
import com.styling.backend.domain.review.entity.Review;
import com.styling.backend.domain.review.entity.ReviewImage;
import com.styling.backend.domain.review.repository.ReviewImageRepository;
import com.styling.backend.domain.review.repository.ReviewRepository;
import com.styling.backend.domain.review.service.ReviewService;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewServiceImpl implements ReviewService {

    private final ReviewRepository reviewRepository;
    private final ReviewImageRepository reviewImageRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ImageService imageService;

    @Override
    @Transactional
    public ReviewCreateResponseDto createReview(
            Long orderPk,
            ReviewCreateRequestDto request,
            List<MultipartFile> images
    ) {
        User user = getLoginUser();

        Order order = orderRepository
                .findByOrderPkAndUser_UserPk(orderPk, user.getUserPk())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!Byte.valueOf(Order.PROCESS_COMPLETED).equals(order.getProcessStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        if (reviewRepository.existsByOrder_OrderPk(orderPk)) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        Stylist stylist = order.getStylist();

        Review review = new Review(
                order,
                user,
                stylist,
                request.getRate(),
                request.getContent()
        );

        reviewRepository.save(review);

        if (images != null && !images.isEmpty()) {
            List<ReviewImage> reviewImages = new ArrayList<>();

            for (int i = 0; i < images.size(); i++) {
                MultipartFile image = images.get(i);

                if (image == null || image.isEmpty()) {
                    continue;
                }

                String imageUrl = imageService.uploadImage(image, "reviews");

                reviewImages.add(
                        new ReviewImage(review, imageUrl, i)
                );
            }

            if (!reviewImages.isEmpty()) {
                reviewImageRepository.saveAll(reviewImages);
            }
        }

        Double averageRate = reviewRepository.findAverageRateByStylistPk(
                stylist.getStylistPk()
        );

        stylist.updateRating(
                BigDecimal.valueOf(averageRate)
                        .setScale(1, RoundingMode.HALF_UP)
        );

        return new ReviewCreateResponseDto(
                review.getReviewPk(),
                review.getRate(),
                review.getContent(),
                review.getCreatedAt()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewListResponseDto> getStylistReviews(Long stylistPk) {
        List<Review> reviews =
                reviewRepository.findAllByStylist_StylistPkOrderByCreatedAtDesc(stylistPk);

        return reviews.stream()
                .map(review -> new ReviewListResponseDto(
                        review.getReviewPk(),
                        review.getUser().getNickname(),
                        review.getUser().getProfilePic(),
                        review.getRate(),
                        review.getContent(),
                        review.getCreatedAt()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewListResponseDto> getMyReviews() {
        User user = getLoginUser();

        List<Review> reviews =
                reviewRepository.findAllByUser_UserPkOrderByCreatedAtDesc(user.getUserPk());

        return reviews.stream()
                .map(review -> new ReviewListResponseDto(
                        review.getReviewPk(),
                        review.getUser().getNickname(),
                        review.getUser().getProfilePic(),
                        review.getRate(),
                        review.getContent(),
                        review.getCreatedAt()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReviewDetailResponseDto getReviewDetail(Long reviewPk) {
        Review review = reviewRepository.findById(reviewPk)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

        List<String> imageUrls = reviewImageRepository
                .findAllByReview_ReviewPkOrderByDisplayOrderAsc(reviewPk)
                .stream()
                .map(ReviewImage::getImageUrl)
                .toList();

        return new ReviewDetailResponseDto(
                review.getReviewPk(),
                review.getUser().getNickname(),
                review.getUser().getProfilePic(),
                review.getRate(),
                review.getContent(),
                review.getCreatedAt(),
                imageUrls
        );
    }

    @Override
    @Transactional
    public ReviewCreateResponseDto updateReview(
            Long reviewPk,
            ReviewCreateRequestDto request
    ) {
        User user = getLoginUser();

        Review review = reviewRepository
                .findByReviewPkAndUser_UserPk(reviewPk, user.getUserPk())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

        review.updateReview(
                request.getRate(),
                request.getContent()
        );

        Stylist stylist = review.getStylist();

        Double averageRate = reviewRepository.findAverageRateByStylistPk(
                stylist.getStylistPk()
        );

        stylist.updateRating(
                BigDecimal.valueOf(averageRate)
                        .setScale(1, RoundingMode.HALF_UP)
        );

        return new ReviewCreateResponseDto(
                review.getReviewPk(),
                review.getRate(),
                review.getContent(),
                review.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public void deleteReview(Long reviewPk) {
        User user = getLoginUser();

        Review review = reviewRepository
                .findByReviewPkAndUser_UserPk(reviewPk, user.getUserPk())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

        Stylist stylist = review.getStylist();

        reviewRepository.delete(review);
        reviewRepository.flush();

        Double averageRate = reviewRepository.findAverageRateByStylistPk(
                stylist.getStylistPk()
        );

        BigDecimal rating = averageRate == null
                ? BigDecimal.ZERO.setScale(1)
                : BigDecimal.valueOf(averageRate)
                        .setScale(1, RoundingMode.HALF_UP);

        stylist.updateRating(rating);
    }

    private User getLoginUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return userRepository.findByUserId(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
    }
}