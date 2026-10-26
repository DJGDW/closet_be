package com.styling.backend.domain.order.controller;

import com.styling.backend.domain.order.dto.OrderCreateRequestDto;
import com.styling.backend.domain.order.dto.OrderCreateResponseDto;
import com.styling.backend.domain.order.dto.PaymentCancelRequestDto;
import com.styling.backend.domain.order.dto.PaymentCancelResponseDto;
import com.styling.backend.domain.order.dto.PaymentConfirmRequestDto;
import com.styling.backend.domain.order.dto.PaymentConfirmResponseDto;
import com.styling.backend.domain.order.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderCreateResponseDto createOrder(
            @Valid @RequestBody OrderCreateRequestDto request
    ) {
        return orderService.createOrder(request);
    }

    @PostMapping("/payment/confirm")
    public PaymentConfirmResponseDto confirmPayment(
            @Valid @RequestBody PaymentConfirmRequestDto request
    ) {
        return orderService.confirmPayment(request);
    }

    @PostMapping("/payment/cancel")
    public PaymentCancelResponseDto cancelPayment(
            @Valid @RequestBody PaymentCancelRequestDto request
    ) {
        return orderService.cancelPayment(request);
    }
}