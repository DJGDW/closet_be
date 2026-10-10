package com.styling.backend.domain.stylist.entity;

import com.styling.backend.domain.location.entity.Location;
import com.styling.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "stylist")
@Getter
@NoArgsConstructor
public class Stylist {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "stylist_pk")
    private Long stylistPk;

    @Column(name = "introduction", length = 255)
    private String introduction;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_pk", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "location_pk", nullable = false)
    private Location location;

    public Stylist(String introduction, User user, Location location) {
        this.introduction = introduction;
        this.user = user;
        this.location = location;
    }
}