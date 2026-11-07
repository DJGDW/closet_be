package com.styling.backend.domain.stylist.repository;

import com.styling.backend.domain.stylist.entity.Stylist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StylistRepository extends JpaRepository<Stylist, Long> {

    boolean existsByUser_UserPk(Long userPk);

    Optional<Stylist> findByUser_UserId(String userId);
}