package dev.darenel.recruiting.auth;

import dev.darenel.recruiting.domain.User;
import dev.darenel.recruiting.repository.UserRepository;
import dev.darenel.recruiting.security.JwtService;
import java.util.Optional;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    // Valid cost-10 bcrypt hash for a fixed timing pad used when no user is found.
    private static final String DUMMY_HASH = "$2b$10$KsaZ9KCJ6ZT8ggGplRKuJ.88TC.5e.1hdLviA6tloCKxpVTfj.tUO";

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
        Optional<User> foundUser = users.findByEmail(request.email().toLowerCase());

        if (foundUser.isEmpty()) {
            passwordEncoder.matches(request.password(), DUMMY_HASH);
            throw new BadCredentialsException("Invalid email or password");
        }

        User user = foundUser.get();

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
