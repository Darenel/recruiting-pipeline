package dev.darenel.recruiting.security;

import static org.assertj.core.api.Assertions.assertThat;

import dev.darenel.recruiting.domain.Role;
import dev.darenel.recruiting.domain.User;
import io.jsonwebtoken.Claims;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    @Test
    void createsAndParsesToken() {
        JwtProperties properties = new JwtProperties("01234567890123456789012345678901", 30);
        JwtService jwtService = new JwtService(properties, Clock.fixed(Instant.parse("2026-07-16T10:00:00Z"), ZoneOffset.UTC));
        User user = new User(UUID.randomUUID(), "Maya Recruiter", "recruiter@recruiting.local",
                "$2a$10$unused", Role.RECRUITER, OffsetDateTime.now());

        String token = jwtService.createToken(user);
        Claims claims = jwtService.parse(token);

        assertThat(claims.getSubject()).isEqualTo("recruiter@recruiting.local");
        assertThat(claims.get("name", String.class)).isEqualTo("Maya Recruiter");
        assertThat(claims.get("role", String.class)).isEqualTo("RECRUITER");
        assertThat(claims.getExpiration().toInstant()).isEqualTo(Instant.parse("2026-07-16T10:30:00Z"));
    }
}
