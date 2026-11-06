package com.styling.backend.domain.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrderUpgradePlanResponseDto {

    private Long stylistPlanPk;
    private Integer planPk;
    private String planTier;
    private String planCode;
    private String description;
    private Integer price;
    private Integer upgradeAmount;
}