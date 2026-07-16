package dev.darenel.recruiting.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "recruiting.security")
public record JwtProperties(String jwtSecret, long jwtExpirationMinutes) {
}
