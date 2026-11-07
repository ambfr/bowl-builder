package com.asgaj.bowl_builder.auth;

import com.asgaj.bowl_builder.user.Role;

public record UserResponse(Long id, String email, String name, Role role) {
}