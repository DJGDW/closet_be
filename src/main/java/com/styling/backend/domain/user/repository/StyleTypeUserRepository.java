package com.styling.backend.domain.user.repository;

import com.styling.backend.domain.user.entity.StyleTypeUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StyleTypeUserRepository extends JpaRepository<StyleTypeUser, Long> {

    List<StyleTypeUser> findByUser_UserPk(Long userPk);
}