package com.styling.backend.domain.review.entity;

import com.styling.backend.domain.order.entity.Order;
import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "review")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_pk")
    private Long reviewPk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_pk", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_pk", nullable = false)
    private Stylist stylist;

    @Column(name = "rate", precision = 2, scale = 1, nullable = false)
    private BigDecimal rate;

    @Column(name = "content", length = 255)
    private String content;

    @Column(name = "created_at")
    private Instant createdAt;

    public Review(
            Order order,
            User user,
            Stylist stylist,
            BigDecimal rate,
            String content
    ) {
        this.order = order;
        this.user = user;
        this.stylist = stylist;
        this.rate = rate;
        this.content = content;
        this.createdAt = Instant.now();
    }

    public void updateReview(BigDecimal rate, String content) {
        this.rate = rate;
        this.content = content;
    }
}