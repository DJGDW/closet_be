package com.styling.backend.domain.user.service;

import com.styling.backend.domain.user.entity.UserBodyRatio;

import java.util.Map;

public interface BodyTypeClassificationService {

    Map<String, String> classify(UserBodyRatio userBodyRatio);
}