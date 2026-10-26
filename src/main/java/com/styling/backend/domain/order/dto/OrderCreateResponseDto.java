package com.styling.backend.domain.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class OrderCreateResponseDto {

    private Long orderPk;
    private String orderId;
    private String orderName;
    private Integer amount;
}