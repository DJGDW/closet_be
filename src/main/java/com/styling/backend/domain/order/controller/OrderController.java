package com.styling.backend.domain.order.controller;

import com.styling.backend.domain.order.dto.OrderCreateRequestDto;
import com.styling.backend.domain.order.dto.OrderCreateResponseDto;
import com.styling.backend.domain.order.dto.OrderListResponseDto;
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

import java.util.List;

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

    @Operation(summary = "결제 승인", description = "토스페이먼츠 결제를 승인하고 주문을 진행 상태로 변경합니다.")
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

    @Operation(summary = "서비스 완료", description = "고객이 본인의 진행 중인 주문을 완료 처리합니다.")
    @PatchMapping("/{orderPk}/complete")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void completeOrder(
            @PathVariable Long orderPk
    ) {
        orderService.completeOrder(orderPk);
    }

    @Operation(summary = "주문 목록 조회", description = "로그인한 고객의 주문 목록을 최신순으로 조회합니다.")
    @GetMapping
    public List<OrderListResponseDto> getOrderList() {
        return orderService.getOrderList();
    }
}