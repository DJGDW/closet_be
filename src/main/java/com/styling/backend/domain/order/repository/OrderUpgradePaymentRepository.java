package com.styling.backend.domain.order.repository;

import com.styling.backend.domain.order.entity.OrderUpgradePayment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrderUpgradePaymentRepository
        extends JpaRepository<OrderUpgradePayment, Long> {

    Optional<OrderUpgradePayment> findByOrderNum(String orderNum);

    Optional<OrderUpgradePayment> findByOrderNumAndOrder_User_UserPk(
            String orderNum,
            Long userPk
    );
}