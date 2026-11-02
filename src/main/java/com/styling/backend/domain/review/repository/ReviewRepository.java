package com.styling.backend.domain.review.repository;

import com.styling.backend.domain.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    boolean existsByOrder_OrderPk(Long orderPk);

    @Query("SELECT AVG(r.rate) FROM Review r WHERE r.stylist.stylistPk = :stylistPk")
    Double findAverageRateByStylistPk(@Param("stylistPk") Long stylistPk);

    Long countByStylist_StylistPk(Long stylistPk);

    List<Review> findAllByStylist_StylistPkOrderByCreatedAtDesc(Long stylistPk);

    List<Review> findAllByUser_UserPkOrderByCreatedAtDesc(Long userPk);

    Optional<Review> findByReviewPkAndUser_UserPk(Long reviewPk, Long userPk);
}