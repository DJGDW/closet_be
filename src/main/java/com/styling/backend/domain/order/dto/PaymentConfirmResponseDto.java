package com.styling.backend.domain.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class PaymentConfirmResponseDto {

    private Long orderPk;
    private Byte purchaseStatus;
    private String paymentMethod;
    private Instant approvedAt;
    private Long roomPk;
}