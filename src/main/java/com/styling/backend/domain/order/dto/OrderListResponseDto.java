package com.styling.backend.domain.order.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.Instant;

@Getter
@AllArgsConstructor
public class OrderListResponseDto {

    private Long orderPk;
    private String orderName;
    private String stylistName;
    private String stylistNickname;
    private String stylistProfilePic;
    private Integer price;
    private Byte purchaseStatus;
    private Byte processStatus;
    private Instant orderStarted;
    private Instant orderFinished;
}