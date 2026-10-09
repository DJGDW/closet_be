package com.styling.backend.domain.user.mapper;

import com.styling.backend.domain.user.dto.UserSignupRequestDto;
import com.styling.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {

    private final PasswordEncoder passwordEncoder;

    public User toEntity(UserSignupRequestDto request) {
        return new User(
                request.getUserName(),
                request.getUserId(),
                passwordEncoder.encode(request.getUserPw()),
                request.getPhoneNumber(),
                request.getBirthDate(),
                request.getEmail(),
                request.getNickname(),
                request.getGender(),
                request.getProfilePic()
        );
    }
}