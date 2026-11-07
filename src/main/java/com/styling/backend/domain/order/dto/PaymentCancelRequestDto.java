package com.styling.backend.domain.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class PaymentCancelRequestDto {

    @NotNull
    @Positive
    private Long orderPk;

    @NotBlank
    private String cancelReason;
}