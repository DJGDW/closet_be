package com.styling.backend.domain.user.service;

import com.styling.backend.domain.user.entity.UserBody;

public interface BodyRatioService {

    void calculateAndSave(UserBody userBody);
}