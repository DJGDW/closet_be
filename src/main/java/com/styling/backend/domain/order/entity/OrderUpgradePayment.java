package com.styling.backend.domain.order.entity;

import com.styling.backend.domain.stylist.entity.StylistPlan;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "order_upgrade_payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderUpgradePayment {

    public static final byte PAYMENT_PENDING = 0;
    public static final byte PAYMENT_COMPLETED = 1;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "upgrade_payment_pk")
    private Long upgradePaymentPk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_pk", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_plan_pk", nullable = false)
    private StylistPlan stylistPlan;

    @Column(name = "order_num", nullable = false, unique = true)
    private String orderNum;

    @Column(name = "amount", nullable = false)
    private Integer amount;

    @Column(name = "payment_status", nullable = false)
    private Byte paymentStatus;

    @Column(name = "payment_key", length = 200)
    private String paymentKey;

    @Column(name = "payment_method", length = 30)
    private String paymentMethod;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public OrderUpgradePayment(
            Order order,
            StylistPlan stylistPlan,
            String orderNum,
            Integer amount
    ) {
        this.order = order;
        this.stylistPlan = stylistPlan;
        this.orderNum = orderNum;
        this.amount = amount;
        this.paymentStatus = PAYMENT_PENDING;
    }

    public void completePayment(
            String paymentKey,
            String paymentMethod,
            Instant approvedAt
    ) {
        this.paymentKey = paymentKey;
        this.paymentMethod = paymentMethod;
        this.approvedAt = approvedAt;
        this.paymentStatus = PAYMENT_COMPLETED;
    }
}