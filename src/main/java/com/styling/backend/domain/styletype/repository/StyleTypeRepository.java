package com.styling.backend.domain.styletype.repository;

import com.styling.backend.domain.styletype.entity.StyleType;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StyleTypeRepository extends JpaRepository<StyleType, Long> {
}