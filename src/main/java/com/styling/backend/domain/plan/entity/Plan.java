package com.styling.backend.domain.plan.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_pk")
    private Integer planPk;

    @Column(name = "plan_tier", length = 20)
    private String planTier;

    @Column(name = "plan_code", length = 20)
    private String planCode;

    @Column(name = "description", length = 255)
    private String description;
}