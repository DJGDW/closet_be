package com.styling.backend.domain.user.service;

import com.styling.backend.domain.ratio.entity.RatioType;

import java.util.List;

public interface UserBodyTagService {

    List<RatioType> getUserBodyTags(Long userPk);
}