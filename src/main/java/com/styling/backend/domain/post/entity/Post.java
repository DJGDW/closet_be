package com.styling.backend.domain.post.entity;

import com.styling.backend.domain.styletype.entity.StyleType;
import com.styling.backend.domain.ratio.entity.RatioType;
import com.styling.backend.domain.stylist.entity.Stylist;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "post")
@Getter
@NoArgsConstructor
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "post_pk")
    private Long postPk;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @Column(name = "view_count")
    private Integer viewCount;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_pk", nullable = false)
    private Stylist stylist;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_pk", nullable = false)
    private StyleType styleType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ratio_pk", nullable = false)
    private RatioType ratioType;

    @Column(name = "content", length = 255)
    private String content;

    public Post(
            Stylist stylist,
            String content,
            StyleType styleType,
            RatioType ratioType
    ) {
        this.stylist = stylist;
        this.content = content;
        this.styleType = styleType;
        this.ratioType = ratioType;
        this.viewCount = 0;
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}