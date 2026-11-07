package com.styling.backend.domain.location.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "location")
@Getter
@NoArgsConstructor
public class Location {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "location_pk")
    private Integer locationPk;

    @Column(name = "location_name", length = 15)
    private String locationName;

    @Column(name = "location_code", length = 30)
    private String locationCode;
}