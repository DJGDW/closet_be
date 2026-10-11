package com.styling.backend.domain.post.repository;

import com.styling.backend.domain.post.entity.PostHashtag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostHashtagRepository extends JpaRepository<PostHashtag, Long> {
}