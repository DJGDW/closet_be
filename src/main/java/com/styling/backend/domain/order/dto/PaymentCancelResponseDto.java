package com.styling.backend.domain.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class PaymentCancelResponseDto {

    private Long orderPk;
    private Byte purchaseStatus;
    private Instant cancelledAt;
}