package com.styling.backend.domain.user.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
public class UserUpdateRequestDto {

    private String userName;

    private String phoneNumber;

    private LocalDate birthDate;

    private String email;

    private String nickname;

    private Integer gender;
}