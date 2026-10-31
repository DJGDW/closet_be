package com.styling.backend.domain.hashtag.repository;

import com.styling.backend.domain.hashtag.entity.Hashtag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HashtagRepository extends JpaRepository<Hashtag, Long> {

    Optional<Hashtag> findByHashtagContent(String hashtagContent);
}