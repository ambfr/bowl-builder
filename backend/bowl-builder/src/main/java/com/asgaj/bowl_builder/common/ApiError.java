package com.asgaj.bowl_builder.common;

import java.time.Instant;

public record ApiError(int status, String error, Instant timestamp) {

    public static ApiError of(int status, String error) {
        return new ApiError(status, error, Instant.now());
    }
}