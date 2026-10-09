package com.styling.backend.domain.user.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "user")
@Getter
@NoArgsConstructor
public class User {

    private static final int DEFAULT_ROLE = 0;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_pk")
    private Long userPk;

    @Column(name = "user_name", length = 10)
    private String userName;

    @Column(name = "user_id", length = 20)
    private String userId;

    @Column(name = "user_pw", length = 60)
    private String userPw;

    @Column(name = "phone_number", length = 11)
    private String phoneNumber;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "email", length = 50)
    private String email;

    @Column(name = "nickname", length = 10)
    private String nickname;

    @Column(name = "gender")
    private Integer gender;

    @Column(name = "profile_pic", length = 255)
    private String profilePic;

    @Column(name = "role")
    private Integer role;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public User(String userName, String userId, String userPw,
                String phoneNumber, LocalDate birthDate, String email,
                String nickname, Integer gender, String profilePic) {
        this.userName = userName;
        this.userId = userId;
        this.userPw = userPw;
        this.phoneNumber = phoneNumber;
        this.birthDate = birthDate;
        this.email = email;
        this.nickname = nickname;
        this.gender = gender;
        this.profilePic = profilePic;
        this.role = DEFAULT_ROLE;
    }

    @PrePersist
    private void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.role == null) {
            this.role = DEFAULT_ROLE;
        }
    }

    @PreUpdate
    private void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
