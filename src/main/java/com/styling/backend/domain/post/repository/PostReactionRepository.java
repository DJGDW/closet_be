package com.styling.backend.domain.post.repository;

import com.styling.backend.domain.post.entity.PostReaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {

    Optional<PostReaction> findByUser_UserPkAndPost_PostPk(Long userPk, Long postPk);

    long countByPost_PostPkAndReactionType(Long postPk, Integer reactionType);
}