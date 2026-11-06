package com.styling.backend.domain.order.service;

import com.styling.backend.domain.order.dto.OrderCreateRequestDto;
import com.styling.backend.domain.order.dto.OrderCreateResponseDto;
import com.styling.backend.domain.order.dto.OrderListResponseDto;
import com.styling.backend.domain.order.dto.OrderSaleListResponseDto;
import com.styling.backend.domain.order.dto.PaymentCancelRequestDto;
import com.styling.backend.domain.order.dto.PaymentCancelResponseDto;
import com.styling.backend.domain.order.dto.PaymentConfirmRequestDto;
import com.styling.backend.domain.order.dto.PaymentConfirmResponseDto;

import java.util.List;

public interface OrderService {

    OrderCreateResponseDto createOrder(OrderCreateRequestDto request);

    PaymentConfirmResponseDto confirmPayment(
            PaymentConfirmRequestDto request
    );

    PaymentCancelResponseDto cancelPayment(
            PaymentCancelRequestDto request
    );

    void requestOrderCompletion(Long orderPk);

    void confirmOrderCompletion(Long orderPk);

    void rejectOrderCompletion(Long orderPk);

    List<OrderListResponseDto> getOrderList();

    List<OrderSaleListResponseDto> getSaleList();

    OrderCreateResponseDto createUpgradePayment(
            Long orderPk,
            Long stylistPlanPk
    );

    void confirmUpgradePayment(
            PaymentConfirmRequestDto request
    );
}