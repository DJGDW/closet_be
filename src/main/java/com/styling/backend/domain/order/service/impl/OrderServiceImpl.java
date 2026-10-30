package com.styling.backend.domain.order.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import com.styling.backend.domain.order.dto.OrderCreateRequestDto;
import com.styling.backend.domain.order.dto.OrderCreateResponseDto;
import com.styling.backend.domain.order.dto.OrderListResponseDto;
import com.styling.backend.domain.order.dto.PaymentCancelRequestDto;
import com.styling.backend.domain.order.dto.PaymentCancelResponseDto;
import com.styling.backend.domain.order.dto.PaymentConfirmRequestDto;
import com.styling.backend.domain.order.dto.PaymentConfirmResponseDto;
import com.styling.backend.domain.order.entity.Order;
import com.styling.backend.domain.order.repository.OrderRepository;
import com.styling.backend.domain.order.service.OrderService;
import com.styling.backend.domain.stylist.entity.StylistPlan;
import com.styling.backend.domain.stylist.repository.StylistPlanRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import com.styling.backend.global.payment.TossPaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final StylistPlanRepository stylistPlanRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final TossPaymentService tossPaymentService;

    @Override
    @Transactional
    public OrderCreateResponseDto createOrder(OrderCreateRequestDto request) {
        User user = getLoginUser();

        StylistPlan stylistPlan = stylistPlanRepository
                .findById(request.getStylistPlanPk())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

        String orderId = "ORDER-" + UUID.randomUUID()
                .toString()
                .replace("-", "");

        Order order = new Order(
                user,
                stylistPlan,
                orderId,
                stylistPlan.getPrice()
        );

        orderRepository.save(order);

        String orderName = stylistPlan.getPlan().getPlanTier();

        return new OrderCreateResponseDto(
                order.getOrderPk(),
                order.getOrderNum(),
                orderName,
                order.getPrice()
        );
    }

    @Override
    @Transactional
    public PaymentConfirmResponseDto confirmPayment(
            PaymentConfirmRequestDto request
    ) {
        User user = getLoginUser();

        Order order = orderRepository
                .findByOrderNumAndUser_UserPk(
                        request.getOrderId(),
                        user.getUserPk()
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!order.getPrice().equals(request.getAmount())) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        if (Order.PURCHASE_COMPLETED == order.getPurchaseStatus()) {
            ChatRoom existingRoom = chatRoomRepository
                    .findByOrder_OrderPk(order.getOrderPk())
                    .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

            return new PaymentConfirmResponseDto(
                    order.getOrderPk(),
                    order.getPurchaseStatus(),
                    order.getPaymentMethod(),
                    order.getApprovedAt(),
                    existingRoom.getRoomPk()
            );
        }

        if (Order.PURCHASE_PENDING != order.getPurchaseStatus()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        JsonNode payment = tossPaymentService.confirmPayment(
                request.getPaymentKey(),
                request.getOrderId(),
                request.getAmount()
        );

        String paymentKey = payment.path("paymentKey").asText();
        String paymentMethod = payment.path("method").asText();
        String approvedAtValue = payment.path("approvedAt").asText();

        if (paymentKey.isBlank()
                || paymentMethod.isBlank()
                || approvedAtValue.isBlank()) {
            throw new BusinessException(ErrorCode.TOSS_PAYMENT_FAILED);
        }

        Instant approvedAt = OffsetDateTime.parse(approvedAtValue).toInstant();

        order.completePayment(paymentKey, paymentMethod, approvedAt);

        ChatRoom chatRoom = new ChatRoom(
                order.getUser(),
                order.getStylist(),
                order
        );

        chatRoomRepository.save(chatRoom);

        return new PaymentConfirmResponseDto(
                order.getOrderPk(),
                order.getPurchaseStatus(),
                order.getPaymentMethod(),
                order.getApprovedAt(),
                chatRoom.getRoomPk()
        );
    }

    @Override
    @Transactional
    public PaymentCancelResponseDto cancelPayment(
            PaymentCancelRequestDto request
    ) {
        User user = getLoginUser();

        Order order = orderRepository
                .findByOrderPkAndUser_UserPk(
                        request.getOrderPk(),
                        user.getUserPk()
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || order.getPaymentKey() == null
                || order.getPaymentKey().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        tossPaymentService.cancelPayment(
                order.getPaymentKey(),
                request.getCancelReason()
        );

        order.cancelPayment(request.getCancelReason());

        return new PaymentCancelResponseDto(
                order.getOrderPk(),
                order.getPurchaseStatus(),
                order.getCancelledAt()
        );
    }

    @Override
    @Transactional
    public void completeOrder(Long orderPk) {
        User user = getLoginUser();

        Order order = orderRepository
                .findByOrderPkAndUser_UserPk(
                        orderPk,
                        user.getUserPk()
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || !Byte.valueOf(Order.PROCESS_IN_PROGRESS).equals(order.getProcessStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        order.completeService();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderListResponseDto> getOrderList() {
        User user = getLoginUser();

        return orderRepository
                .findAllByUser_UserPkOrderByOrderPkDesc(user.getUserPk())
                .stream()
                .map(order -> new OrderListResponseDto(
                        order.getOrderPk(),
                        order.getStylistPlan().getPlan().getPlanTier(),
                        order.getStylist().getUser().getUserName(),
                        order.getStylist().getUser().getNickname(),
                        order.getStylist().getUser().getProfilePic(),
                        order.getPrice(),
                        order.getPurchaseStatus(),
                        order.getProcessStatus(),
                        order.getOrderStarted(),
                        order.getOrderFinished()
                ))
                .toList();
    }

    private User getLoginUser() {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        return userRepository.findByUserId(authentication.getName())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
    }
}