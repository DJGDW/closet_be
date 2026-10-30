package com.styling.backend.domain.order.repository;

import com.styling.backend.domain.order.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNum(String orderNum);

    Optional<Order> findByOrderNumAndUser_UserPk(String orderNum, Long userPk);

    Optional<Order> findByOrderPkAndUser_UserPk(Long orderPk, Long userPk);

    List<Order> findAllByUser_UserPkOrderByOrderPkDesc(Long userPk);
}