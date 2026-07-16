package dev.darenel.recruiting.auth;

import dev.darenel.recruiting.domain.User;
import dev.darenel.recruiting.repository.UserRepository;
import dev.darenel.recruiting.security.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = users.findByEmail(request.email().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return new LoginResponse(jwtService.createToken(user), UserResponse.from(user));
    }

    @Transactional(readOnly = true)
    public UserResponse me(String email) {
        User user = users.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid token subject"));
        return UserResponse.from(user);
    }
}
