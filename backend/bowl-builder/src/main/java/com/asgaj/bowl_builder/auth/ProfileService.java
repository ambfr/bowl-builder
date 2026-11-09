package com.asgaj.bowl_builder.auth;

import com.asgaj.bowl_builder.user.User;
import com.asgaj.bowl_builder.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProfileService {

    private final UserRepository users;
    private final PasswordEncoder encoder;

    public ProfileService(UserRepository users, PasswordEncoder encoder) {
        this.users = users;
        this.encoder = encoder;
    }

    public UserResponse get(String email) {
        return toResponse(find(email));
    }

    @Transactional
    public UserResponse updateName(String email, String name) {
        User user = find(email);
        user.setName(name.trim());
        return toResponse(users.save(user));
    }

    @Transactional
    public void changePassword(String email, String current, String next) {
        User user = find(email);
        if (!encoder.matches(current, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        }
        if (encoder.matches(next, user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "New password must be different from the current one");
        }
        user.setPasswordHash(encoder.encode(next));
        users.save(user);
    }

    private User find(String email) {
        return users.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User no longer exists"));
    }

    private UserResponse toResponse(User u) {
        return new UserResponse(u.getId(), u.getEmail(), u.getName(), u.getRole());
    }
}