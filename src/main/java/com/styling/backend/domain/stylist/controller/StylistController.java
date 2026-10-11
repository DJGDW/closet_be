package com.styling.backend.domain.stylist.controller;

import com.styling.backend.domain.stylist.dto.StylistRegisterRequestDto;
import com.styling.backend.domain.stylist.dto.response.StylistCheckResponseDto;
import com.styling.backend.domain.stylist.service.StylistService;
import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/stylist")
@RequiredArgsConstructor
public class StylistController {

    private final StylistService stylistService;

    @Operation(summary = "스타일리스트 등록")
    @PostMapping("/register")
    public ResponseEntity<Void> register(
            @Valid @RequestBody StylistRegisterRequestDto request
    ) {
        stylistService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @Operation(summary = "스타일리스트 여부 확인")
    @GetMapping("/check")
    public ResponseEntity<StylistCheckResponseDto> checkStylist() {
        return ResponseEntity.ok(stylistService.checkStylist());
    }
}