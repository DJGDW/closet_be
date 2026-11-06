package com.styling.backend.domain.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class OrderSaleListResponseDto {

    private Long orderPk;
    private Long userPk;
    private Long stylistPk;
    private String orderName;
    private String buyerName;
    private String buyerNickname;
    private String buyerProfilePic;
    private Integer price;
    private Byte purchaseStatus;
    private Byte processStatus;
    private Instant orderStarted;
    private Instant orderFinished;
    private Long completionRequesterUserPk;
}