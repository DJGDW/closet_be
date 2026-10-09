package com.styling.backend.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST),
    USER_ID_REQUIRED(HttpStatus.BAD_REQUEST),
    USER_PW_REQUIRED(HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    USER_ID_DUPLICATED(HttpStatus.CONFLICT),
    NICKNAME_DUPLICATED(HttpStatus.CONFLICT),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}