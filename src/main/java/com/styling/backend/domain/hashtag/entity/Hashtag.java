package com.styling.backend.domain.hashtag.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "hashtag")
@Getter
@NoArgsConstructor
public class Hashtag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "hashtag_pk")
    private Long hashtagPk;

    @Column(name = "hashtag_content", length = 20)
    private String hashtagContent;

    @Column(name = "hashtag_used")
    private Integer hashtagUsed;

    public Hashtag(String hashtagContent) {
        this.hashtagContent = hashtagContent;
        this.hashtagUsed = 1;
    }

    public void increaseUsed() {
        this.hashtagUsed++;
    }
}