package com.styling.backend.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    INVALID_REQUEST(HttpStatus.BAD_REQUEST),
    USER_ID_REQUIRED(HttpStatus.BAD_REQUEST),
    USER_PW_REQUIRED(HttpStatus.BAD_REQUEST),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED),
    USER_ID_DUPLICATED(HttpStatus.CONFLICT),
    NICKNAME_DUPLICATED(HttpStatus.CONFLICT),

    STYLIST_ALREADY_REGISTERED(HttpStatus.CONFLICT),
    LOCATION_NOT_FOUND(HttpStatus.BAD_REQUEST),
    DUPLICATE_STYLE_TYPE(HttpStatus.BAD_REQUEST),
    STYLE_TYPE_NOT_FOUND(HttpStatus.BAD_REQUEST),
    DUPLICATE_PLAN(HttpStatus.BAD_REQUEST),
    PLAN_NOT_FOUND(HttpStatus.BAD_REQUEST),

    ORDER_NOT_FOUND(HttpStatus.NOT_FOUND),
    PAYMENT_AMOUNT_MISMATCH(HttpStatus.BAD_REQUEST),
    TOSS_PAYMENT_FAILED(HttpStatus.BAD_GATEWAY),

    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;

    ErrorCode(HttpStatus status) {
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}