package com.styling.backend.domain.order.service.impl;

import com.fasterxml.jackson.databind.JsonNode;
import com.styling.backend.domain.chat.entity.ChatRoom;
import com.styling.backend.domain.chat.repository.ChatRoomRepository;
import com.styling.backend.domain.notification.service.NotificationService;
import com.styling.backend.domain.order.dto.OrderCreateRequestDto;
import com.styling.backend.domain.order.dto.OrderCreateResponseDto;
import com.styling.backend.domain.order.dto.OrderListResponseDto;
import com.styling.backend.domain.order.dto.OrderSaleListResponseDto;
import com.styling.backend.domain.order.dto.OrderUpgradePlanResponseDto;
import com.styling.backend.domain.order.dto.PaymentCancelRequestDto;
import com.styling.backend.domain.order.dto.PaymentCancelResponseDto;
import com.styling.backend.domain.order.dto.PaymentConfirmRequestDto;
import com.styling.backend.domain.order.dto.PaymentConfirmResponseDto;
import com.styling.backend.domain.order.entity.Order;
import com.styling.backend.domain.order.entity.OrderUpgradePayment;
import com.styling.backend.domain.order.repository.OrderRepository;
import com.styling.backend.domain.order.repository.OrderUpgradePaymentRepository;
import com.styling.backend.domain.order.service.OrderService;
import com.styling.backend.domain.stylist.entity.StylistPlan;
import com.styling.backend.domain.stylist.repository.StylistPlanRepository;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import com.styling.backend.domain.global.payment.TossPaymentService;
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
    private final OrderUpgradePaymentRepository orderUpgradePaymentRepository;
    private final StylistPlanRepository stylistPlanRepository;
    private final UserRepository userRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final TossPaymentService tossPaymentService;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public OrderCreateResponseDto createOrder(OrderCreateRequestDto request) {
        User user = getLoginUser();

        StylistPlan stylistPlan = stylistPlanRepository
                .findById(request.getStylistPlanPk())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

        if (!stylistPlan.isActive()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

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

        ChatRoom chatRoom = chatRoomRepository
                .findFirstByUser_UserPkAndStylist_StylistPkAndRoomTypeAndRoomStatus(
                        order.getUser().getUserPk(),
                        order.getStylist().getStylistPk(),
                        ChatRoom.TYPE_INQUIRY,
                        ChatRoom.STATUS_ACTIVE
                )
                .map(room -> {
                    room.convertToPaymentRoom(order);
                    return room;
                })
                .orElseGet(() -> new ChatRoom(
                        order.getUser(),
                        order.getStylist(),
                        order
                ));

        chatRoomRepository.save(chatRoom);

        notificationService.createNotification(
                order.getStylist().getUser(),
                order.getUser(),
                (byte) 4,
                "새로운 주문이 결제되었습니다.",
                (byte) 3,
                order.getOrderPk()
        );

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
    public void requestOrderCompletion(Long orderPk) {
        User user = getLoginUser();

        Order order = orderRepository
                .findById(orderPk)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        User stylistUser = order.getStylist().getUser();
        User buyerUser = order.getUser();

        boolean isStylist = stylistUser.getUserPk().equals(user.getUserPk());
        boolean isBuyer = buyerUser.getUserPk().equals(user.getUserPk());

        if (!isStylist && !isBuyer) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || !Byte.valueOf(Order.PROCESS_IN_PROGRESS).equals(order.getProcessStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        User receiver = isStylist ? buyerUser : stylistUser;

        order.requestServiceCompletion(user);

        String message = isStylist
                ? "스타일리스트가 서비스 완료를 요청했습니다."
                : "구매자가 서비스 완료를 요청했습니다.";

        notificationService.createNotification(
                receiver,
                user,
                (byte) 4,
                message,
                (byte) 3,
                order.getOrderPk()
        );
    }

    @Override
    @Transactional
    public void confirmOrderCompletion(Long orderPk) {
        User user = getLoginUser();

        Order order = orderRepository
                .findById(orderPk)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        User requester = order.getCompletionRequester();

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || !Byte.valueOf(Order.PROCESS_COMPLETION_REQUESTED).equals(order.getProcessStatus())
                || requester == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        boolean isParticipant = order.getUser().getUserPk().equals(user.getUserPk())
                || order.getStylist().getUser().getUserPk().equals(user.getUserPk());

        if (!isParticipant || requester.getUserPk().equals(user.getUserPk())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        order.confirmServiceCompletion();

        chatRoomRepository.findByOrder_OrderPk(orderPk)
                .ifPresent(ChatRoom::close);

        notificationService.createNotification(
                requester,
                user,
                (byte) 4,
                "상대방이 서비스 완료 요청을 수락했습니다.",
                (byte) 3,
                order.getOrderPk()
        );
    }

    @Override
    @Transactional
    public void rejectOrderCompletion(Long orderPk) {
        User user = getLoginUser();

        Order order = orderRepository
                .findById(orderPk)
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        User requester = order.getCompletionRequester();

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || !Byte.valueOf(Order.PROCESS_COMPLETION_REQUESTED).equals(order.getProcessStatus())
                || requester == null) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        boolean isParticipant = order.getUser().getUserPk().equals(user.getUserPk())
                || order.getStylist().getUser().getUserPk().equals(user.getUserPk());

        if (!isParticipant || requester.getUserPk().equals(user.getUserPk())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        order.rejectServiceCompletion();

        notificationService.createNotification(
                requester,
                user,
                (byte) 4,
                "상대방이 서비스 완료 요청을 거절했습니다.",
                (byte) 3,
                order.getOrderPk()
        );
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
                        order.getUser().getUserPk(),
                        order.getStylist().getStylistPk(),
                        order.getStylistPlan().getPlan().getPlanTier(),
                        order.getStylist().getUser().getUserName(),
                        order.getStylist().getUser().getNickname(),
                        order.getStylist().getUser().getProfilePic(),
                        order.getPrice(),
                        order.getPurchaseStatus(),
                        order.getProcessStatus(),
                        order.getOrderStarted(),
                        order.getOrderFinished(),
                        order.getCompletionRequester() != null
                                ? order.getCompletionRequester().getUserPk()
                                : null
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderSaleListResponseDto> getSaleList() {
        User user = getLoginUser();

        return orderRepository
                .findAllByStylist_User_UserPkOrderByOrderPkDesc(user.getUserPk())
                .stream()
                .map(order -> new OrderSaleListResponseDto(
                        order.getOrderPk(),
                        order.getUser().getUserPk(),
                        order.getStylist().getStylistPk(),
                        order.getStylistPlan().getPlan().getPlanTier(),
                        order.getUser().getUserName(),
                        order.getUser().getNickname(),
                        order.getUser().getProfilePic(),
                        order.getPrice(),
                        order.getPurchaseStatus(),
                        order.getProcessStatus(),
                        order.getOrderStarted(),
                        order.getOrderFinished(),
                        order.getCompletionRequester() != null
                                ? order.getCompletionRequester().getUserPk()
                                : null
                ))
                .toList();
    }

    @Override
    @Transactional
    public OrderCreateResponseDto createUpgradePayment(
            Long orderPk,
            Long stylistPlanPk
    ) {
        User user = getLoginUser();

        Order order = orderRepository
                .findByOrderPkAndUser_UserPk(orderPk, user.getUserPk())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || !Byte.valueOf(Order.PROCESS_IN_PROGRESS).equals(order.getProcessStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        StylistPlan targetPlan = stylistPlanRepository
                .findById(stylistPlanPk)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REQUEST));

        if (!targetPlan.isActive()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        if (!order.getStylist().getStylistPk()
                .equals(targetPlan.getStylist().getStylistPk())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        int currentTier = getPlanTier(order.getStylistPlan().getPlan().getPlanCode());
        int targetTier = getPlanTier(targetPlan.getPlan().getPlanCode());

        if (targetTier <= currentTier) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        int amount = targetPlan.getPrice() - order.getStylistPlan().getPrice();

        if (amount <= 0) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        String orderId = "UPGRADE-" + UUID.randomUUID()
                .toString()
                .replace("-", "");

        OrderUpgradePayment upgradePayment = new OrderUpgradePayment(
                order,
                targetPlan,
                orderId,
                amount
        );

        orderUpgradePaymentRepository.save(upgradePayment);

        String orderName = order.getStylistPlan().getPlan().getPlanTier()
                + " → "
                + targetPlan.getPlan().getPlanTier();

        return new OrderCreateResponseDto(
                order.getOrderPk(),
                orderId,
                orderName,
                amount
        );
    }

    @Override
    @Transactional
    public void confirmUpgradePayment(PaymentConfirmRequestDto request) {
        User user = getLoginUser();

        OrderUpgradePayment upgradePayment = orderUpgradePaymentRepository
                .findByOrderNumAndOrder_User_UserPk(
                        request.getOrderId(),
                        user.getUserPk()
                )
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (!upgradePayment.getAmount().equals(request.getAmount())) {
            throw new BusinessException(ErrorCode.PAYMENT_AMOUNT_MISMATCH);
        }

        if (OrderUpgradePayment.PAYMENT_COMPLETED
                == upgradePayment.getPaymentStatus()) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        Order order = upgradePayment.getOrder();

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || !Byte.valueOf(Order.PROCESS_IN_PROGRESS).equals(order.getProcessStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        StylistPlan targetPlan = upgradePayment.getStylistPlan();

        if (!order.getStylist().getStylistPk()
                .equals(targetPlan.getStylist().getStylistPk())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        int currentTier = getPlanTier(order.getStylistPlan().getPlan().getPlanCode());
        int targetTier = getPlanTier(targetPlan.getPlan().getPlanCode());

        if (targetTier <= currentTier
                || targetPlan.getPrice() - order.getStylistPlan().getPrice()
                != upgradePayment.getAmount()) {
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

        upgradePayment.completePayment(
                paymentKey,
                paymentMethod,
                approvedAt
        );

        order.upgradePlan(targetPlan);

        notificationService.createNotification(
                order.getStylist().getUser(),
                order.getUser(),
                (byte) 4,
                "사용자가 서비스 플랜을 업그레이드했습니다.",
                (byte) 3,
                order.getOrderPk()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderUpgradePlanResponseDto> getUpgradePlans(Long orderPk) {
        User user = getLoginUser();

        Order order = orderRepository
                .findByOrderPkAndUser_UserPk(orderPk, user.getUserPk())
                .orElseThrow(() -> new BusinessException(ErrorCode.ORDER_NOT_FOUND));

        if (Order.PURCHASE_COMPLETED != order.getPurchaseStatus()
                || !Byte.valueOf(Order.PROCESS_IN_PROGRESS).equals(order.getProcessStatus())) {
            throw new BusinessException(ErrorCode.INVALID_REQUEST);
        }

        int currentTier = getPlanTier(
                order.getStylistPlan().getPlan().getPlanCode()
        );

        int currentPrice = order.getStylistPlan().getPrice();

        return stylistPlanRepository
                .findAllByStylist_StylistPkAndActiveTrue(
                        order.getStylist().getStylistPk()
                )
                .stream()
                .filter(stylistPlan ->
                        getPlanTier(stylistPlan.getPlan().getPlanCode()) > currentTier
                )
                .map(stylistPlan -> {
                    int upgradeAmount = stylistPlan.getPrice() - currentPrice;

                    return new OrderUpgradePlanResponseDto(
                            stylistPlan.getStylistPlanPk(),
                            stylistPlan.getPlan().getPlanPk(),
                            stylistPlan.getPlan().getPlanTier(),
                            stylistPlan.getPlan().getPlanCode(),
                            stylistPlan.getPlan().getDescription(),
                            stylistPlan.getPrice(),
                            upgradeAmount
                    );
                })
                .filter(plan -> plan.getUpgradeAmount() > 0)
                .toList();
    }

    private int getPlanTier(String planCode) {
        return switch (planCode) {
            case "BRONZE" -> 1;
            case "SILVER" -> 2;
            case "GOLD" -> 3;
            default -> throw new BusinessException(ErrorCode.INVALID_REQUEST);
        };
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