package com.styling.backend.domain.ratio.mapper;

import com.styling.backend.domain.ratio.entity.RatioType;
import com.styling.backend.domain.ratio.repository.RatioTypeRepository;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Component
public class BodyRatioTagMapper {

    private final RatioTypeRepository ratioTypeRepository;

    public BodyRatioTagMapper(RatioTypeRepository ratioTypeRepository) {
        this.ratioTypeRepository = ratioTypeRepository;
    }

    public List<RatioType> toRatioTypes(
            Map<String, String> classifications
    ) {
        List<String> ratioCodes = new ArrayList<>();

        addCode(ratioCodes, classifications, "shoulder", "LOW",
                "NARROW_SHOULDER_COMP");

        addCode(ratioCodes, classifications, "belly", "LOW",
                "THIN_WAIST_COMP");
        addCode(ratioCodes, classifications, "belly", "HIGH",
                "THICK_WAIST_COMP");

        addCode(ratioCodes, classifications, "thigh", "LOW",
                "THIN_THIGH_COMP");
        addCode(ratioCodes, classifications, "thigh", "HIGH",
                "THICK_THIGH_COMP");

        addCode(ratioCodes, classifications, "calf", "LOW",
                "THIN_CALF_COMP");
        addCode(ratioCodes, classifications, "calf", "HIGH",
                "THICK_CALF_COMP");

        addCode(ratioCodes, classifications, "leg", "SHORT",
                "SHORT_LEG_COMP");

        List<RatioType> ratioTypes = new ArrayList<>();

        for (String ratioCode : ratioCodes) {
            RatioType ratioType = ratioTypeRepository
                    .findByRatioCode(ratioCode)
                    .orElseThrow(() -> new IllegalStateException(
                            "등록되지 않은 체형 보완 태그입니다: " + ratioCode
                    ));

            ratioTypes.add(ratioType);
        }

        return ratioTypes;
    }

    private void addCode(
            List<String> ratioCodes,
            Map<String, String> classifications,
            String bodyPart,
            String classification,
            String ratioCode
    ) {
        if (classification.equals(classifications.get(bodyPart))) {
            ratioCodes.add(ratioCode);
        }
    }
}