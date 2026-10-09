package com.styling.backend.domain.user.service;

import com.styling.backend.domain.user.dto.UserLoginRequestDto;
import com.styling.backend.domain.user.dto.UserLoginResponseDto;
import com.styling.backend.domain.user.dto.UserSignupRequestDto;
import com.styling.backend.domain.user.entity.StyleType;
import com.styling.backend.domain.user.entity.StyleTypeUser;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.entity.UserBody;
import com.styling.backend.domain.user.mapper.UserMapper;
import com.styling.backend.domain.user.repository.StyleTypeRepository;
import com.styling.backend.domain.user.repository.StyleTypeUserRepository;
import com.styling.backend.domain.user.repository.UserBodyRepository;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserBodyRepository userBodyRepository;
    private final StyleTypeRepository styleTypeRepository;
    private final StyleTypeUserRepository styleTypeUserRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Value("${jwt.access-token-expiration}")
    private long accessTokenExpiration;

    @Transactional
    public void signup(UserSignupRequestDto request) {

        if (userRepository.existsByUserId(request.getUserId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        User user = userMapper.toEntity(request);
        userRepository.save(user);

        UserSignupRequestDto.UserBodyInfo body = request.getBody();

        UserBody userBody = new UserBody(
                user,
                body.getTall(),
                body.getWeight(),
                body.getChestSize(),
                body.getWaistSize(),
                body.getShoulderWidth(),
                body.getHips(),
                body.getThigh(),
                body.getCalf()
        );

        userBodyRepository.save(userBody);

        for (Long typePk : request.getStyleTypePks()) {
            StyleType styleType = styleTypeRepository.findById(typePk)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "존재하지 않는 스타일 유형입니다: " + typePk
                            ));

            StyleTypeUser styleTypeUser = new StyleTypeUser(user, styleType);
            styleTypeUserRepository.save(styleTypeUser);
        }
    }

    @Transactional(readOnly = true)
    public UserLoginResponseDto login(UserLoginRequestDto request) {

        User user = userRepository.findByUserId(request.getUserId())
                .orElseThrow(() ->
                        new BusinessException(ErrorCode.INVALID_CREDENTIALS));

        if (!passwordEncoder.matches(
                request.getUserPw(),
                user.getUserPw()
        )) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        String accessToken = jwtService.generateAccessToken(user.getUserId());

        return new UserLoginResponseDto(
                accessToken,
                "Bearer",
                accessTokenExpiration / 1000,
                user.getUserPk(),
                user.getUserId(),
                user.getNickname()
        );
    }

    @Transactional(readOnly = true)
    public boolean checkUserIdDuplicate(String userId) {
        return !userRepository.existsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public boolean checkNicknameDuplicate(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }
}