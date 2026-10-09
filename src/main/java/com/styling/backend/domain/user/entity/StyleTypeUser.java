package com.styling.backend.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "style_type_user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StyleTypeUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_type_pk")
    private Long userTypePk;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "type_pk", nullable = false)
    private StyleType styleType;

    public StyleTypeUser(User user, StyleType styleType) {
        this.user = user;
        this.styleType = styleType;
    }
}