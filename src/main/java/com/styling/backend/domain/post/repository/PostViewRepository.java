package com.styling.backend.domain.post.repository;

import com.styling.backend.domain.post.entity.PostView;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostViewRepository extends JpaRepository<PostView, Long> {

    boolean existsByPost_PostPkAndUser_UserPk(Long postPk, Long userPk);
}