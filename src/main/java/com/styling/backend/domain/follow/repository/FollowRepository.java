package com.styling.backend.domain.follow.repository;

import com.styling.backend.domain.follow.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {

    boolean existsByUser_UserPkAndStylist_StylistPk(Long userPk, Long stylistPk);

    Optional<Follow> findByUser_UserPkAndStylist_StylistPk(Long userPk, Long stylistPk);

    List<Follow> findAllByUser_UserPk(Long userPk);

    Long countByStylist_StylistPk(Long stylistPk);
}