package com.styling.backend.domain.order.entity;

import com.styling.backend.domain.stylist.entity.Stylist;
import com.styling.backend.domain.stylist.entity.StylistPlan;
import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "`order`")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order {

    public static final byte PURCHASE_PENDING = 0;
    public static final byte PURCHASE_COMPLETED = 1;
    public static final byte PURCHASE_CANCELLED = 2;

    public static final byte PROCESS_PENDING = 0;
    public static final byte PROCESS_IN_PROGRESS = 1;
    public static final byte PROCESS_COMPLETED = 2;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "order_pk")
    private Long orderPk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_pk", nullable = false)
    private Stylist stylist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_plan_pk", nullable = false)
    private StylistPlan stylistPlan;

    @Column(name = "purchase_status")
    private Byte purchaseStatus;

    @Column(name = "process_status")
    private Byte processStatus;

    @Column(name = "order_started")
    private Instant orderStarted;

    @Column(name = "order_finished")
    private Instant orderFinished;

    @Column(name = "order_num")
    private String orderNum;

    @Column(name = "price")
    private Integer price;

    @Column(name = "payment_key", length = 200)
    private String paymentKey;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "cancel_reason", length = 200)
    private String cancelReason;

    public Order(
            User user,
            StylistPlan stylistPlan,
            String orderNum,
            Integer price
    ) {
        this.user = user;
        this.stylistPlan = stylistPlan;
        this.stylist = stylistPlan.getStylist();
        this.orderNum = orderNum;
        this.price = price;
        this.purchaseStatus = PURCHASE_PENDING;
        this.processStatus = PROCESS_PENDING;
    }

    public void completePayment(
            String paymentKey,
            String paymentMethod,
            Instant approvedAt
    ) {
        this.paymentKey = paymentKey;
        this.paymentMethod = paymentMethod;
        this.approvedAt = approvedAt;
        this.purchaseStatus = PURCHASE_COMPLETED;
        this.processStatus = PROCESS_IN_PROGRESS;
        this.orderStarted = approvedAt;
    }

    public void completeService() {
        this.processStatus = PROCESS_COMPLETED;
        this.orderFinished = Instant.now();
    }

    public void cancelPayment(String cancelReason) {
        this.cancelReason = cancelReason;
        this.cancelledAt = Instant.now();
        this.purchaseStatus = PURCHASE_CANCELLED;
    }
}