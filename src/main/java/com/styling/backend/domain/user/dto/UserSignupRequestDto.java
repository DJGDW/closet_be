package com.styling.backend.domain.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
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
@JsonPropertyOrder({
        "userName",
        "userId",
        "userPw",
        "phoneNumber",
        "birthDate",
        "email",
        "gender",
        "body",
        "profilePic",
        "nickname",
        "styleTypePks"
})
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

    private String profilePic;

    private String nickname;

    @NotNull
    private List<Long> styleTypePks;

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonPropertyOrder({
            "tall",
            "weight",
            "chestSize",
            "waistSize",
            "shoulderWidth",
            "hips",
            "thigh",
            "calf",
            "leg"
    })
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
        private Integer leg;

        @AssertTrue(message = "신체정보는 전부 입력하거나 전부 비워야 합니다.")
        @JsonIgnore
        public boolean isOptionalBodyInfoValid() {
            boolean allNull =
                    chestSize == null &&
                    waistSize == null &&
                    shoulderWidth == null &&
                    hips == null &&
                    thigh == null &&
                    calf == null &&
                    leg == null;

            boolean allFilled =
                    chestSize != null &&
                    waistSize != null &&
                    shoulderWidth != null &&
                    hips != null &&
                    thigh != null &&
                    calf != null &&
                    leg != null;

            return allNull || allFilled;
        }
    }
}