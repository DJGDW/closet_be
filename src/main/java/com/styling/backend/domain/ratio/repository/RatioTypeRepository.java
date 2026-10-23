package com.styling.backend.domain.ratio.repository;

import com.styling.backend.domain.ratio.entity.RatioType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RatioTypeRepository extends JpaRepository<RatioType, Long> {

    Optional<RatioType> findByRatioCode(String ratioCode);
}