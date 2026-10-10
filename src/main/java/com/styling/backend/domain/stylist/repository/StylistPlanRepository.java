package com.styling.backend.domain.stylist.repository;

import com.styling.backend.domain.stylist.entity.StylistPlan;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StylistPlanRepository extends JpaRepository<StylistPlan, Long> {
}