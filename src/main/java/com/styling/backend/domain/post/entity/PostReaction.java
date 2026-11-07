package com.styling.backend.domain.post.entity;

import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "post_reaction")
@Getter
@NoArgsConstructor
public class PostReaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reaction_pk")
    private Long reactionPk;

    @Column(name = "reaction_type", columnDefinition = "TINYINT")
    private Integer reactionType;

    @Column(name = "created_at")
    private Instant createdAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_pk", nullable = false)
    private Post post;

    public PostReaction(User user, Post post, Integer reactionType) {
        this.user = user;
        this.post = post;
        this.reactionType = reactionType;
        this.createdAt = Instant.now();
    }

    public void changeReactionType(Integer reactionType) {
        this.reactionType = reactionType;
        this.createdAt = Instant.now();
    }
}