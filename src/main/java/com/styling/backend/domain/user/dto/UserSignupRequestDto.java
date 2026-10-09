package com.styling.backend.domain.user.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class UserSignupRequestDto {

    @NotBlank
    private String userName;

    @NotBlank
    private String userId;

    @NotBlank
    private String userPw;

    @NotBlank
    private String phoneNumber;

    @NotNull
    private LocalDate birthDate;

    @NotBlank
    private String email;

    @NotNull
    private Integer gender;

    @Valid
    @NotNull
    private UserBodyInfo body;

    @NotNull
    private List<Long> styleTypePks;

    private String nickname;

    private String profilePic;

    @Getter
    @Setter
    @NoArgsConstructor
    public static class UserBodyInfo {

        @NotNull
        @Positive
        private Integer tall;

        @NotNull
        @DecimalMin("0.1")
        private BigDecimal weight;

        private Integer chestSize;
        private Integer waistSize;
        private Integer shoulderWidth;
        private Integer hips;
        private Integer thigh;
        private Integer calf;
    }
}