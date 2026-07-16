package dev.darenel.recruiting.auth;

import dev.darenel.recruiting.domain.Role;
import dev.darenel.recruiting.domain.User;
import java.util.UUID;

public record UserResponse(UUID id, String name, String email, Role role) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
