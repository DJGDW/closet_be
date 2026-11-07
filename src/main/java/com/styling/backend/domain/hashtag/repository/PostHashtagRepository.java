package com.styling.backend.domain.hashtag.repository;

import com.styling.backend.domain.post.entity.PostHashtag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostHashtagRepository extends JpaRepository<PostHashtag, Long> {

    List<PostHashtag> findByPost_PostPk(Long postPk);
}