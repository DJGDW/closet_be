package com.styling.backend.domain.review.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@AllArgsConstructor
public class ReviewCreateResponseDto {

    private Long reviewPk;
    private BigDecimal rate;
    private String content;
    private Instant createdAt;
}