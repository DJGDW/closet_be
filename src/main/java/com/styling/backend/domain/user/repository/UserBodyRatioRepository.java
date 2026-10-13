package com.styling.backend.domain.user.repository;

import com.styling.backend.domain.user.entity.UserBody;
import com.styling.backend.domain.user.entity.UserBodyRatio;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserBodyRatioRepository
        extends JpaRepository<UserBodyRatio, Long> {

    Optional<UserBodyRatio> findByUserBody(UserBody userBody);
}