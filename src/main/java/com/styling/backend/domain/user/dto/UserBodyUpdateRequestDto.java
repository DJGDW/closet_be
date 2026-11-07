package com.styling.backend.domain.user.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
public class UserBodyUpdateRequestDto {

    @Positive
    private Integer tall;

    @DecimalMin("0.1")
    private BigDecimal weight;

    @Positive
    private Integer chestSize;

    @Positive
    private Integer waistSize;

    @Positive
    private Integer shoulderWidth;

    @Positive
    private Integer hips;

    @Positive
    private Integer thigh;

    @Positive
    private Integer calf;

    @Positive
    private Integer leg;
}