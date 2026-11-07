package com.styling.backend.domain.post.entity;

import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(
    name = "post_view",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_post_view_user_post",
            columnNames = {"post_pk", "user_pk"}
        )
    }
)
@Getter
@NoArgsConstructor
public class PostView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_view_pk")
    private Long postViewPk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_pk", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @Column(name = "view_time", nullable = false)
    private Instant viewTime;

    public PostView(Post post, User user) {
        this.post = post;
        this.user = user;
        this.viewTime = Instant.now();
    }
}