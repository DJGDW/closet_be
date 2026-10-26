package com.styling.backend.domain.post.repository;

import com.styling.backend.domain.post.entity.Post;
import com.styling.backend.domain.post.entity.PostReaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findAllByOrderByCreatedAtDesc();

    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Post> findByStyleType_TypePkOrderByCreatedAtDesc(
            Long typePk,
            Pageable pageable
    );

    @Query(
            value = """
                    SELECT p
                    FROM Post p
                    LEFT JOIN PostReaction r
                        ON r.post.postPk = p.postPk
                        AND r.reactionType = 0
                    GROUP BY p
                    ORDER BY COUNT(r.reactionPk) DESC, p.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(p)
                    FROM Post p
                    """
    )
    Page<Post> findAllOrderByLikeCountDesc(Pageable pageable);

    @Query(
            value = """
                    SELECT p
                    FROM Post p
                    LEFT JOIN PostReaction r
                        ON r.post.postPk = p.postPk
                        AND r.reactionType = 0
                    WHERE p.styleType.typePk = :typePk
                    GROUP BY p
                    ORDER BY COUNT(r.reactionPk) DESC, p.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(p)
                    FROM Post p
                    WHERE p.styleType.typePk = :typePk
                    """
    )
    Page<Post> findByStyleTypeOrderByLikeCountDesc(
            @Param("typePk") Long typePk,
            Pageable pageable
    );
}