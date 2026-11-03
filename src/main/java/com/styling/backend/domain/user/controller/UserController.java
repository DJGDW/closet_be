package com.styling.backend.domain.user.controller;

import com.styling.backend.domain.global.image.ImageService;
import com.styling.backend.domain.user.dto.UserBodyUpdateRequestDto;
import com.styling.backend.domain.user.dto.UserLoginRequestDto;
import com.styling.backend.domain.user.dto.UserLoginResponseDto;
import com.styling.backend.domain.user.dto.UserPasswordUpdateRequestDto;
import com.styling.backend.domain.user.dto.UserSignupRequestDto;
import com.styling.backend.domain.user.dto.UserUpdateRequestDto;
import com.styling.backend.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {

    private final UserService userService;
    private final ImageService imageService;

    @Operation(summary = "회원가입")
    @PostMapping(
            value = "/signup",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Void> signup(
            @Parameter(
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(
                                    implementation = UserSignupRequestDto.class
                            )
                    )
            )
            @Valid @RequestPart("request") UserSignupRequestDto request,

            @RequestPart(value = "profileImage", required = false)
            MultipartFile profileImage
    ) {
        String profilePic = imageService.uploadImage(
                profileImage,
                "stylist/user-profile"
        );

        if (profilePic != null) {
            request.setProfilePic(profilePic);
        }

        userService.signup(request);

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<UserLoginResponseDto> login(
            @Valid @RequestBody UserLoginRequestDto request
    ) {
        return ResponseEntity.ok(userService.login(request));
    }

    @Operation(summary = "아이디 중복확인")
    @GetMapping("/check-id")
    public ResponseEntity<Boolean> checkUserIdDuplicate(
            @RequestParam String userId
    ) {
        return ResponseEntity.ok(
                userService.checkUserIdDuplicate(userId)
        );
    }

    @Operation(summary = "닉네임 중복확인")
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNicknameDuplicate(
            @RequestParam String nickname
    ) {
        return ResponseEntity.ok(
                userService.checkNicknameDuplicate(nickname)
        );
    }

    @Operation(summary = "개인정보 부분 수정")
    @PatchMapping(
            value = "/update",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Void> updateInfo(
            @Parameter(
                    content = @Content(
                            mediaType = MediaType.APPLICATION_JSON_VALUE,
                            schema = @Schema(
                                    implementation = UserUpdateRequestDto.class
                            )
                    )
            )
            @Valid @RequestPart("request") UserUpdateRequestDto request,

            @RequestPart(value = "profileImage", required = false)
            MultipartFile profileImage
    ) {
        String profilePic = null;

        if (profileImage != null && !profileImage.isEmpty()) {
            profilePic = imageService.uploadImage(
                    profileImage,
                    "stylist/user-profile"
            );
        }

        userService.updateInfo(request, profilePic);

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "비밀번호 변경")
    @PatchMapping("/password")
    public ResponseEntity<Void> updatePassword(
            @Valid @RequestBody UserPasswordUpdateRequestDto request
    ) {
        userService.updatePassword(request);

        return ResponseEntity.ok().build();
    }

    @Operation(summary = "체형 정보 부분 수정")
    @PatchMapping("/body")
    public ResponseEntity<Void> updateBody(
            @Valid @RequestBody UserBodyUpdateRequestDto request
    ) {
        userService.updateBody(request);

        return ResponseEntity.ok().build();
    }
}