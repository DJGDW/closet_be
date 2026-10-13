package com.styling.backend.domain.ratio.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ratio_type")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RatioType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ratio_pk")
    private Long ratioPk;

    @Column(name = "ratio_type", nullable = false, length = 30)
    private String ratioType;

    @Column(name = "ratio_code", nullable = false, length = 30)
    private String ratioCode;
}