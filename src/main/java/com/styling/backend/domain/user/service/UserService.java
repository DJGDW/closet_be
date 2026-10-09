package com.styling.backend.domain.user.service;

import com.styling.backend.domain.user.dto.UserSignupRequestDto;
import com.styling.backend.domain.user.entity.StyleType;
import com.styling.backend.domain.user.entity.StyleTypeUser;
import com.styling.backend.domain.user.entity.User;
import com.styling.backend.domain.user.entity.UserBody;
import com.styling.backend.domain.user.repository.StyleTypeRepository;
import com.styling.backend.domain.user.repository.StyleTypeUserRepository;
import com.styling.backend.domain.user.repository.UserBodyRepository;
import com.styling.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void signup(UserSignupRequestDto request) {

        if (userRepository.existsByUserId(request.getUserId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }

        User user = new User(
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
                            new IllegalArgumentException("존재하지 않는 스타일 유형입니다: " + typePk));

            StyleTypeUser styleTypeUser = new StyleTypeUser(user, styleType);
            styleTypeUserRepository.save(styleTypeUser);
        }
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