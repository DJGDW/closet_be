package com.styling.backend.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
    name = "user_body_ratio",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "UK_USER_BODY_RATIO_BODY",
            columnNames = "body_pk"
        )
    }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserBodyRatio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ratio_pk", nullable = false)
    private Long ratioPk;

    @Column(name = "shoulder_ratio", nullable = false)
    private Float shoulderRatio;

    @Column(name = "belly_ratio", nullable = false)
    private Float bellyRatio;

    @Column(name = "thigh_ratio", nullable = false)
    private Float thighRatio;

    @Column(name = "calf_ratio", nullable = false)
    private Float calfRatio;

    @Column(name = "leg_ratio", nullable = false)
    private Float legRatio;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(
        name = "body_pk",
        nullable = false,
        unique = true,
        foreignKey = @ForeignKey(name = "FK_USER_BODY_RATIO_BODY")
    )
    private UserBody userBody;

    public UserBodyRatio(
            UserBody userBody,
            Float shoulderRatio,
            Float bellyRatio,
            Float thighRatio,
            Float calfRatio,
            Float legRatio
    ) {
        this.userBody = userBody;
        this.shoulderRatio = shoulderRatio;
        this.bellyRatio = bellyRatio;
        this.thighRatio = thighRatio;
        this.calfRatio = calfRatio;
        this.legRatio = legRatio;
    }

    public void updateRatios(
            Float shoulderRatio,
            Float bellyRatio,
            Float thighRatio,
            Float calfRatio,
            Float legRatio
    ) {
        this.shoulderRatio = shoulderRatio;
        this.bellyRatio = bellyRatio;
        this.thighRatio = thighRatio;
        this.calfRatio = calfRatio;
        this.legRatio = legRatio;
    }
}