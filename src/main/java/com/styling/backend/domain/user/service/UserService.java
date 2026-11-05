package com.styling.backend.domain.user.service;

import com.styling.backend.domain.styletype.entity.StyleType;
import com.styling.backend.domain.styletype.repository.StyleTypeRepository;
import com.styling.backend.domain.user.dto.UserBodyUpdateRequestDto;
import com.styling.backend.domain.user.dto.UserLoginRequestDto;
import com.styling.backend.domain.user.dto.UserLoginResponseDto;
import com.styling.backend.domain.user.dto.UserPasswordUpdateRequestDto;
import com.styling.backend.domain.user.dto.UserProfileResponseDto;
import com.styling.backend.domain.user.dto.UserSignupRequestDto;
import com.styling.backend.domain.user.dto.UserUpdateRequestDto;
import com.styling.backend.domain.user.entity.StyleTypeUser;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.entity.UserBody;
import com.styling.backend.domain.user.mapper.UserMapper;
import com.styling.backend.domain.user.repository.StyleTypeUserRepository;
import com.styling.backend.domain.user.repository.UserBodyRatioRepository;
import com.styling.backend.domain.user.repository.UserBodyRepository;
import com.styling.backend.domain.user.repository.UserRepository;
import com.styling.backend.exception.BusinessException;
import com.styling.backend.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserBodyRepository userBodyRepository;
    private final UserBodyRatioRepository userBodyRatioRepository;
    private final StyleTypeRepository styleTypeRepository;
    private final StyleTypeUserRepository styleTypeUserRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final BodyRatioService bodyRatioService;

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

        if (body != null) {
            UserBody userBody = new UserBody(
                    user,
                    body.getTall(),
                    body.getWeight(),
                    body.getChestSize(),
                    body.getWaistSize(),
                    body.getShoulderWidth(),
                    body.getHips(),
                    body.getThigh(),
                    body.getCalf(),
                    body.getLeg()
            );

            userBodyRepository.save(userBody);

            bodyRatioService.calculateAndSave(userBody);
        }

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
    public UserProfileResponseDto getMyProfile() {

        User user = getAuthenticatedUser();

        UserProfileResponseDto.UserBodyInfo bodyInfo =
                userBodyRepository.findByUser_UserPk(user.getUserPk())
                        .map(userBody -> {

                            UserProfileResponseDto.UserBodyRatioInfo ratioInfo =
                                    userBodyRatioRepository
                                            .findByUserBody_User_UserPk(user.getUserPk())
                                            .map(ratio ->
                                                    new UserProfileResponseDto.UserBodyRatioInfo(
                                                            ratio.getShoulderRatio(),
                                                            ratio.getBellyRatio(),
                                                            ratio.getThighRatio(),
                                                            ratio.getCalfRatio(),
                                                            ratio.getLegRatio()
                                                    ))
                                            .orElse(null);

                            return new UserProfileResponseDto.UserBodyInfo(
                                    userBody.getTall(),
                                    userBody.getWeight(),
                                    userBody.getChestSize(),
                                    userBody.getWaistSize(),
                                    userBody.getShoulderWidth(),
                                    userBody.getHips(),
                                    userBody.getThigh(),
                                    userBody.getCalf(),
                                    userBody.getLeg(),
                                    ratioInfo
                            );
                        })
                        .orElse(null);

        List<UserProfileResponseDto.StyleTypeInfo> styleTypes =
                styleTypeUserRepository.findByUser_UserPk(user.getUserPk())
                        .stream()
                        .map(styleTypeUser -> {
                            StyleType styleType = styleTypeUser.getStyleType();

                            return new UserProfileResponseDto.StyleTypeInfo(
                                    styleType.getTypePk(),
                                    styleType.getStyleName(),
                                    styleType.getStyleCode()
                            );
                        })
                        .toList();

        return new UserProfileResponseDto(
                user.getUserPk(),
                user.getUserId(),
                user.getUserName(),
                user.getNickname(),
                user.getPhoneNumber(),
                user.getBirthDate(),
                user.getEmail(),
                user.getGender(),
                user.getProfilePic(),
                user.getRole(),
                user.getCreatedAt(),
                bodyInfo,
                styleTypes
        );
    }

    @Transactional
    public void updateInfo(UserUpdateRequestDto request, String profilePic) {

        User user = getAuthenticatedUser();

        if (request.getNickname() != null) {

            if (request.getNickname().isBlank()) {
                throw new IllegalArgumentException("닉네임은 비워둘 수 없습니다.");
            }

            if (userRepository.existsByNicknameAndUserPkNot(
                    request.getNickname(),
                    user.getUserPk()
            )) {
                throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
            }
        }

        user.updateInfo(
                request.getUserName(),
                request.getPhoneNumber(),
                request.getBirthDate(),
                request.getEmail(),
                request.getNickname(),
                request.getGender(),
                profilePic
        );
    }

    @Transactional
    public void updatePassword(UserPasswordUpdateRequestDto request) {

        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(
                request.getCurrentPassword(),
                user.getUserPw()
        )) {
            throw new BusinessException(ErrorCode.INVALID_CREDENTIALS);
        }

        user.changePassword(
                passwordEncoder.encode(request.getNewPassword())
        );
    }

    @Transactional
    public void updateBody(UserBodyUpdateRequestDto request) {

        User user = getAuthenticatedUser();

        UserBody userBody = userBodyRepository
                .findByUser_UserPk(user.getUserPk())
                .orElse(null);

        if (userBody == null) {

            if (request.getTall() == null || request.getWeight() == null) {
                throw new IllegalArgumentException(
                        "최초 체형 정보 등록 시 키와 몸무게는 필수입니다."
                );
            }

            userBody = new UserBody(
                    user,
                    request.getTall(),
                    request.getWeight(),
                    request.getChestSize(),
                    request.getWaistSize(),
                    request.getShoulderWidth(),
                    request.getHips(),
                    request.getThigh(),
                    request.getCalf(),
                    request.getLeg()
            );

            userBodyRepository.save(userBody);

        } else {

            userBody.updateInfo(
                    request.getTall(),
                    request.getWeight(),
                    request.getChestSize(),
                    request.getWaistSize(),
                    request.getShoulderWidth(),
                    request.getHips(),
                    request.getThigh(),
                    request.getCalf(),
                    request.getLeg()
            );
        }

        bodyRatioService.calculateAndSave(userBody);
    }

    @Transactional(readOnly = true)
    public boolean checkUserIdDuplicate(String userId) {
        return !userRepository.existsByUserId(userId);
    }

    @Transactional(readOnly = true)
    public boolean checkNicknameDuplicate(String nickname) {
        return !userRepository.existsByNickname(nickname);
    }

    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof String userId)) {
            throw new IllegalStateException("로그인이 필요합니다.");
        }

        return userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}