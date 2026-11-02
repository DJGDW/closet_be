package com.styling.backend.domain.review.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class ReviewCreateRequestDto {

    @NotNull
    @DecimalMin("0.5")
    @DecimalMax("5.0")
    private BigDecimal rate;

    @Size(max = 255)
    private String content;
}