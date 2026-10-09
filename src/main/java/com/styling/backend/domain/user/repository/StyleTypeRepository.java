package com.styling.backend.domain.user.repository;

import com.styling.backend.domain.user.entity.StyleType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StyleTypeRepository extends JpaRepository<StyleType, Long> {
}