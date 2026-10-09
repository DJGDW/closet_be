package com.styling.backend.domain.user.controller;

import com.styling.backend.domain.user.dto.UserLoginRequestDto;
import com.styling.backend.domain.user.dto.UserLoginResponseDto;
import com.styling.backend.domain.user.dto.UserSignupRequestDto;
import com.styling.backend.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/user")
public class UserController {

    private final UserService userService;

    @Operation(summary = "회원가입")
    @PostMapping("/signup")
    public ResponseEntity<Void> signup(
            @Valid @RequestBody UserSignupRequestDto request) {
        userService.signup(request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "로그인")
    @PostMapping("/login")
    public ResponseEntity<UserLoginResponseDto> login(
            @Valid @RequestBody UserLoginRequestDto request) {
        return ResponseEntity.ok(userService.login(request));
    }

    @Operation(summary = "아이디 중복확인")
    @GetMapping("/check-id")
    public ResponseEntity<Boolean> checkUserIdDuplicate(
            @RequestParam String userId) {
        return ResponseEntity.ok(
                userService.checkUserIdDuplicate(userId)
        );
    }

    @Operation(summary = "닉네임 중복확인")
    @GetMapping("/check-nickname")
    public ResponseEntity<Boolean> checkNicknameDuplicate(
            @RequestParam String nickname) {
        return ResponseEntity.ok(
                userService.checkNicknameDuplicate(nickname)
        );
    }
}