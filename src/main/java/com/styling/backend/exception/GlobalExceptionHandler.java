package com.styling.backend.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Map<String, String>> handleBusinessException(
            BusinessException e) {

        ErrorCode errorCode = e.getErrorCode();

        return ResponseEntity
                .status(errorCode.getStatus())
                .body(Map.of("code", errorCode.name()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationException(
            MethodArgumentNotValidException e) {

        String field = e.getBindingResult()
                .getFieldErrors()
                .get(0)
                .getField();

        ErrorCode errorCode = switch (field) {
            case "userId" -> ErrorCode.USER_ID_REQUIRED;
            case "userPw" -> ErrorCode.USER_PW_REQUIRED;
            default -> ErrorCode.INVALID_REQUEST;
        };

        return ResponseEntity
                .status(errorCode.getStatus())
                .body(Map.of("code", errorCode.name()));
    }
}