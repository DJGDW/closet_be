package com.styling.backend.domain.user.service.impl;

import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.entity.UserBodyRatio;
import com.styling.backend.domain.user.service.BodyTypeClassificationService;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class BodyTypeClassificationServiceImpl
        implements BodyTypeClassificationService {

    private static final int MALE = 0;
    private static final int FEMALE = 1;

    @Override
    public Map<String, String> classify(UserBodyRatio userBodyRatio) {
        if (userBodyRatio == null
                || userBodyRatio.getUserBody() == null
                || userBodyRatio.getUserBody().getUser() == null) {
            throw new IllegalArgumentException(
                    "사용자 체형 비율 정보가 없습니다."
            );
        }

        User user = userBodyRatio.getUserBody().getUser();
        Integer gender = user.getGender();

        if (gender == null || (gender != MALE && gender != FEMALE)) {
            throw new IllegalArgumentException(
                    "체형 분류를 위한 성별 정보가 올바르지 않습니다."
            );
        }

        Map<String, String> result = new LinkedHashMap<>();

        result.put(
                "shoulder",
                classifyRange(
                        userBodyRatio.getShoulderRatio(),
                        gender == MALE ? 22.32f : 21.32f,
                        gender == MALE ? 23.81f : 22.94f
                )
        );

        result.put(
                "belly",
                classifyRange(
                        userBodyRatio.getBellyRatio(),
                        gender == MALE ? 46.18f : 43.33f,
                        gender == MALE ? 55.08f : 53.72f
                )
        );

        result.put(
                "thigh",
                classifyRange(
                        userBodyRatio.getThighRatio(),
                        gender == MALE ? 57.97f : 57.47f,
                        gender == MALE ? 61.68f : 61.64f
                )
        );

        result.put(
                "calf",
                classifyRange(
                        userBodyRatio.getCalfRatio(),
                        gender == MALE ? 63.16f : 59.97f,
                        gender == MALE ? 68.73f : 65.79f
                )
        );

        float legThreshold = gender == MALE ? 43.69f : 43.88f;

        result.put(
                "leg",
                userBodyRatio.getLegRatio() < legThreshold
                        ? "SHORT"
                        : "NORMAL"
        );

        return result;
    }

    private String classifyRange(
            Float ratio,
            float lowerBound,
            float upperBound
    ) {
        if (ratio == null) {
            throw new IllegalArgumentException(
                    "체형 비율 정보가 없습니다."
            );
        }

        if (ratio < lowerBound) {
            return "LOW";
        }

        if (ratio > upperBound) {
            return "HIGH";
        }

        return "NORMAL";
    }
}