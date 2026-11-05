package com.styling.backend.domain.user.repository;

import com.styling.backend.domain.user.entity.UserBody;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserBodyRepository extends JpaRepository<UserBody, Long> {

    Optional<UserBody> findByUser_UserPk(Long userPk);
}