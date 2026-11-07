package com.asgaj.bowl_builder.auth;

public record LoginResponse(String token, UserResponse user) {
}