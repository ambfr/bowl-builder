package com.asgaj.bowl_builder.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank @Size(max = 60, message = "must be at most 60 characters") String name
) {
}