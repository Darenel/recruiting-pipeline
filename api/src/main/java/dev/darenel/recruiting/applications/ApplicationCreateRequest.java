package dev.darenel.recruiting.applications;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ApplicationCreateRequest(
        @NotNull UUID candidateId,
        @NotNull UUID vacancyId) {
}
