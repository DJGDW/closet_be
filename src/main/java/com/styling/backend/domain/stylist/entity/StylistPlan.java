package com.styling.backend.domain.stylist.entity;

import com.styling.backend.domain.plan.entity.Plan;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stylist_plan")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StylistPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stylist_plan_pk")
    private Long stylistPlanPk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_pk", nullable = false)
    private Plan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_pk", nullable = false)
    private Stylist stylist;

    @Column(name = "price")
    private Integer price;

    public StylistPlan(Plan plan, Stylist stylist, Integer price) {
        this.plan = plan;
        this.stylist = stylist;
        this.price = price;
    }
}