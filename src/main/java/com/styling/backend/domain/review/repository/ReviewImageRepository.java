package com.styling.backend.domain.review.repository;

import com.styling.backend.domain.review.entity.ReviewImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewImageRepository extends JpaRepository<ReviewImage, Long> {

    List<ReviewImage> findAllByReview_ReviewPkOrderByDisplayOrderAsc(Long reviewPk);

    void deleteAllByReview_ReviewPk(Long reviewPk);
}