package com.styling.backend.domain.stylist.repository;

import com.styling.backend.domain.stylist.entity.StylistStyleType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StylistStyleTypeRepository extends JpaRepository<StylistStyleType, Long> {

    List<StylistStyleType> findAllByStylist_StylistPk(Long stylistPk);
}