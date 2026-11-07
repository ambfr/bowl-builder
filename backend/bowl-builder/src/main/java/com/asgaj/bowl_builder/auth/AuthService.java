package com.asgaj.bowl_builder.auth;

import com.asgaj.bowl_builder.user.Role;
import com.asgaj.bowl_builder.user.User;
import com.asgaj.bowl_builder.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        User user = new User(email, passwordEncoder.encode(request.password()),
                request.name().trim(), Role.CUSTOMER);
        user = userRepository.save(user);
        return new UserResponse(user.getId(), user.getEmail(), user.getName(), user.getRole());
    }
}