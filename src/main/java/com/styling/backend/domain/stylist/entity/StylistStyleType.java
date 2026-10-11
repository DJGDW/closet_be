package com.styling.backend.domain.stylist.entity;

import com.styling.backend.domain.styletype.entity.StyleType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stylist_style_type")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StylistStyleType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stylist_type_pk")
    private Long stylistTypePk;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "type_pk", nullable = false)
    private StyleType styleType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "stylist_pk", nullable = false)
    private Stylist stylist;

    public StylistStyleType(StyleType styleType, Stylist stylist) {
        this.styleType = styleType;
        this.stylist = stylist;
    }
}