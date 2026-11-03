package com.styling.backend.domain.review.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "review_image")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReviewImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "image_pk")
    private Long imagePk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "review_pk", nullable = false)
    private Review review;

    @Column(name = "image_url", length = 2048, nullable = false)
    private String imageUrl;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public ReviewImage(Review review, String imageUrl, Integer displayOrder) {
        this.review = review;
        this.imageUrl = imageUrl;
        this.displayOrder = displayOrder;
        this.createdAt = Instant.now();
    }
}