package com.styling.backend.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "user_body")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBody {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "body_pk")
    private Long bodyPk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @Column(name = "tall", nullable = false)
    private Integer tall;

    @Column(name = "weight", nullable = false, precision = 4, scale = 1)
    private BigDecimal weight;

    @Column(name = "chest_size")
    private Integer chestSize;

    @Column(name = "waist_size")
    private Integer waistSize;

    @Column(name = "shoulder_width")
    private Integer shoulderWidth;

    @Column(name = "hips")
    private Integer hips;

    @Column(name = "thigh")
    private Integer thigh;

    @Column(name = "calf")
    private Integer calf;

    public UserBody(User user, Integer tall, BigDecimal weight,
                    Integer chestSize, Integer waistSize,
                    Integer shoulderWidth, Integer hips,
                    Integer thigh, Integer calf) {
        this.user = user;
        this.tall = tall;
        this.weight = weight;
        this.chestSize = chestSize;
        this.waistSize = waistSize;
        this.shoulderWidth = shoulderWidth;
        this.hips = hips;
        this.thigh = thigh;
        this.calf = calf;
    }
}