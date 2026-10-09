package com.styling.backend.domain.user.controller;

import com.styling.backend.domain.user.dto.UserSignupRequestDto;
import com.styling.backend.domain.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
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
            @RequestBody UserSignupRequestDto request) {
        userService.signup(request);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "아이디 중복확인")
    @GetMapping("/check-id")
    public ResponseEntity<Boolean> checkUserIdDuplicate(
            @RequestParam String userId) {
        return ResponseEntity.ok(
                userService.checkUserIdDuplicate(userId)
        );
    }
}