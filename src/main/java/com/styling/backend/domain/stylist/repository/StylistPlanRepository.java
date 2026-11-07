package com.styling.backend.domain.stylist.repository;

import com.styling.backend.domain.stylist.entity.StylistPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StylistPlanRepository extends JpaRepository<StylistPlan, Long> {

    List<StylistPlan> findAllByStylist_StylistPk(Long stylistPk);
}