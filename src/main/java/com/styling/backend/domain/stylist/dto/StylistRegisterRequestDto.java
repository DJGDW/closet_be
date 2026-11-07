package com.styling.backend.domain.stylist.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class StylistRegisterRequestDto {

    @Size(max = 255)
    private String introduction;

    @NotNull
    @Positive
    private Integer locationPk;

    @NotNull
    @Size(min = 1)
    private List<@NotNull @Positive Long> styleTypePks;

    @NotNull
    @Size(min = 1, max = 3)
    @Valid
    private List<StylistPlanRequestDto> plans;

    @Getter
    @NoArgsConstructor
    public static class StylistPlanRequestDto {

        @NotNull
        @Positive
        private Integer planPk;

        @NotNull
        @Positive
        private Integer price;
    }
}