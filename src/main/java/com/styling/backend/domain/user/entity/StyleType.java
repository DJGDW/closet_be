package com.styling.backend.domain.user.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "style_type")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StyleType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "type_pk")
    private Long typePk;

    @Column(name = "style_name", length = 25)
    private String styleName;

    @Column(name = "style_code", length = 25)
    private String styleCode;
}