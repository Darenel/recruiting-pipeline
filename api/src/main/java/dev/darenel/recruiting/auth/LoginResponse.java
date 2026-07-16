package dev.darenel.recruiting.auth;

public record LoginResponse(String accessToken, UserResponse user) {
}
