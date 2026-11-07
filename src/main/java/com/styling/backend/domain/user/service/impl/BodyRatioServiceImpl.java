package com.styling.backend.domain.user.service.impl;

import com.styling.backend.domain.user.entity.UserBody;
import com.styling.backend.domain.user.entity.UserBodyRatio;
import com.styling.backend.domain.user.repository.UserBodyRatioRepository;
import com.styling.backend.domain.user.service.BodyRatioService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BodyRatioServiceImpl implements BodyRatioService {

    private final UserBodyRatioRepository userBodyRatioRepository;

    @Override
    @Transactional
    public void calculateAndSave(UserBody userBody) {

        if (userBody == null) {
            return;
        }

        Integer tall = userBody.getTall();
        Integer shoulderWidth = userBody.getShoulderWidth();
        Integer waistSize = userBody.getWaistSize();
        Integer hips = userBody.getHips();
        Integer thigh = userBody.getThigh();
        Integer calf = userBody.getCalf();
        Integer leg = userBody.getLeg();

        if (tall == null
                || shoulderWidth == null
                || waistSize == null
                || hips == null
                || thigh == null
                || calf == null
                || leg == null) {
            return;
        }

        if (tall <= 0 || hips <= 0 || thigh <= 0) {
            throw new IllegalArgumentException(
                    "비율 계산에 필요한 신체 치수는 0보다 커야 합니다."
            );
        }

        // 비율 계산
        float shoulderRatio =
                shoulderWidth.floatValue() / tall * 100.0f;

        float bellyRatio =
                waistSize.floatValue() / tall * 100.0f;

        float thighRatio =
                thigh.floatValue() / hips * 100.0f;

        float calfRatio =
                calf.floatValue() / thigh * 100.0f;

        float legRatio =
                leg.floatValue() / tall * 100.0f;

        UserBodyRatio ratio = userBodyRatioRepository
                .findByUserBody(userBody)
                .orElse(null);

        if (ratio == null) {
            ratio = new UserBodyRatio(
                    userBody,
                    shoulderRatio,
                    bellyRatio,
                    thighRatio,
                    calfRatio,
                    legRatio
            );
        } else {
            ratio.updateRatios(
                    shoulderRatio,
                    bellyRatio,
                    thighRatio,
                    calfRatio,
                    legRatio
            );
        }

        userBodyRatioRepository.save(ratio);
    }
}