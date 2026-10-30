package com.styling.backend.domain.order.controller;

import com.styling.backend.domain.order.dto.OrderCreateRequestDto;
import com.styling.backend.domain.order.dto.OrderCreateResponseDto;
import com.styling.backend.domain.order.dto.PaymentCancelRequestDto;
import com.styling.backend.domain.order.dto.PaymentCancelResponseDto;
import com.styling.backend.domain.order.dto.PaymentConfirmRequestDto;
import com.styling.backend.domain.order.dto.PaymentConfirmResponseDto;
import com.styling.backend.domain.order.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @Operation(summary = "주문 생성", description = "스타일리스트 플랜 구매를 위한 주문을 생성합니다.")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderCreateResponseDto createOrder(
            @Valid @RequestBody OrderCreateRequestDto request
    ) {
        return orderService.createOrder(request);
    }

    @Operation(summary = "결제 승인", description = "토스페이먼츠 결제를 승인하고 주문을 완료합니다.")
    @PostMapping("/payment/confirm")
    public PaymentConfirmResponseDto confirmPayment(
            @Valid @RequestBody PaymentConfirmRequestDto request
    ) {
        return orderService.confirmPayment(request);
    }

    @Operation(summary = "결제 취소", description = "완료된 결제를 취소합니다.")
    @PostMapping("/payment/cancel")
    public PaymentCancelResponseDto cancelPayment(
            @Valid @RequestBody PaymentCancelRequestDto request
    ) {
        return orderService.cancelPayment(request);
    }
}