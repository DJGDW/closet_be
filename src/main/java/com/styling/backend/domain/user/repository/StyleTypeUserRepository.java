package com.styling.backend.domain.user.repository;

import com.styling.backend.domain.user.entity.StyleTypeUser;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StyleTypeUserRepository extends JpaRepository<StyleTypeUser, Long> {
}