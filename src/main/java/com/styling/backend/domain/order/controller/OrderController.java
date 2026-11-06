package com.styling.backend.domain.order.controller;

import com.styling.backend.domain.order.dto.OrderCreateRequestDto;
import com.styling.backend.domain.order.dto.OrderCreateResponseDto;
import com.styling.backend.domain.order.dto.OrderListResponseDto;
import com.styling.backend.domain.order.dto.OrderSaleListResponseDto;
import com.styling.backend.domain.order.dto.OrderUpgradePlanResponseDto;
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

    @Operation(summary = "서비스 완료 요청", description = "구매자 또는 스타일리스트가 상대방에게 서비스 완료를 요청합니다.")
    @PatchMapping("/{orderPk}/complete/request")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestOrderCompletion(
            @PathVariable Long orderPk
    ) {
        orderService.requestOrderCompletion(orderPk);
    }

    @Operation(summary = "서비스 완료 승인", description = "완료 요청을 받은 상대방이 승인하여 주문을 최종 완료합니다.")
    @PatchMapping("/{orderPk}/complete/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmOrderCompletion(
            @PathVariable Long orderPk
    ) {
        orderService.confirmOrderCompletion(orderPk);
    }

    @Operation(summary = "서비스 완료 거절", description = "완료 요청을 받은 상대방이 거절하여 주문을 진행 상태로 되돌립니다.")
    @PatchMapping("/{orderPk}/complete/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void rejectOrderCompletion(
            @PathVariable Long orderPk
    ) {
        orderService.rejectOrderCompletion(orderPk);
    }

    @Operation(summary = "주문 목록 조회", description = "로그인한 고객의 주문 목록을 최신순으로 조회합니다.")
    @GetMapping
    public List<OrderListResponseDto> getOrderList() {
        return orderService.getOrderList();
    }

    @Operation(summary = "판매내역 조회", description = "로그인한 스타일리스트의 전체 판매내역을 최신순으로 조회합니다.")
    @GetMapping("/sales")
    public List<OrderSaleListResponseDto> getSaleList() {
        return orderService.getSaleList();
    }

    @Operation(summary = "업그레이드 가능 플랜 조회", description = "기존 주문에서 업그레이드할 수 있는 상위 플랜 목록을 조회합니다.")
    @GetMapping("/{orderPk}/upgrade-plans")
    public List<OrderUpgradePlanResponseDto> getUpgradePlans(
            @PathVariable Long orderPk
    ) {
        return orderService.getUpgradePlans(orderPk);
    }

    @Operation(summary = "플랜 업그레이드 결제 생성", description = "기존 주문의 상위 플랜 업그레이드를 위한 추가 결제 정보를 생성합니다.")
    @PostMapping("/{orderPk}/upgrade")
    @ResponseStatus(HttpStatus.CREATED)
    public OrderCreateResponseDto createUpgradePayment(
            @PathVariable Long orderPk,
            @Valid @RequestBody OrderCreateRequestDto request
    ) {
        return orderService.createUpgradePayment(
                orderPk,
                request.getStylistPlanPk()
        );
    }

    @Operation(summary = "플랜 업그레이드 결제 승인", description = "추가 결제를 승인하고 기존 주문의 플랜을 변경합니다.")
    @PostMapping("/upgrade/payment/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirmUpgradePayment(
            @Valid @RequestBody PaymentConfirmRequestDto request
    ) {
        orderService.confirmUpgradePayment(request);
    }
}