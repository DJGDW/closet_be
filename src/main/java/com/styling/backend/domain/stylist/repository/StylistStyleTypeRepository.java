package com.styling.backend.domain.stylist.repository;

import com.styling.backend.domain.stylist.entity.StylistStyleType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StylistStyleTypeRepository extends JpaRepository<StylistStyleType, Long> {
}