package com.asgaj.bowl_builder.auth;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users/me")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping
    public UserResponse get(Authentication auth) {
        return service.get(auth.getName());
    }

    @PatchMapping
    public UserResponse update(Authentication auth, @Valid @RequestBody ProfileUpdateRequest request) {
        return service.updateName(auth.getName(), request.name());
    }

    @PostMapping("/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(Authentication auth, @Valid @RequestBody PasswordChangeRequest request) {
        service.changePassword(auth.getName(), request.currentPassword(), request.newPassword());
    }
}