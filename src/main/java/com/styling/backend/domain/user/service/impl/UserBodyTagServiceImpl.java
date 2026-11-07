package com.styling.backend.domain.user.service.impl;

import com.styling.backend.domain.ratio.entity.RatioType;
import com.styling.backend.domain.ratio.mapper.BodyRatioTagMapper;
import com.styling.backend.domain.user.entity.UserBodyRatio;
import com.styling.backend.domain.user.repository.UserBodyRatioRepository;
import com.styling.backend.domain.user.service.BodyTypeClassificationService;
import com.styling.backend.domain.user.service.UserBodyTagService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class UserBodyTagServiceImpl implements UserBodyTagService {

    private final UserBodyRatioRepository userBodyRatioRepository;
    private final BodyTypeClassificationService bodyTypeClassificationService;
    private final BodyRatioTagMapper bodyRatioTagMapper;

    public UserBodyTagServiceImpl(
            UserBodyRatioRepository userBodyRatioRepository,
            BodyTypeClassificationService bodyTypeClassificationService,
            BodyRatioTagMapper bodyRatioTagMapper
    ) {
        this.userBodyRatioRepository = userBodyRatioRepository;
        this.bodyTypeClassificationService = bodyTypeClassificationService;
        this.bodyRatioTagMapper = bodyRatioTagMapper;
    }

    @Override
    public List<RatioType> getUserBodyTags(Long userPk) {
        if (userPk == null) {
            throw new IllegalArgumentException("사용자 PK가 필요합니다.");
        }

        UserBodyRatio userBodyRatio = userBodyRatioRepository
                .findByUserBody_User_UserPk(userPk)
                .orElseThrow(() -> new IllegalArgumentException(
                        "사용자의 신체 비율 정보를 찾을 수 없습니다."
                ));

        Map<String, String> classifications =
                bodyTypeClassificationService.classify(userBodyRatio);

        return bodyRatioTagMapper.toRatioTypes(classifications);
    }
}