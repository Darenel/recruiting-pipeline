package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.Stage;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record StageChangeRequest(
        @NotNull Stage toStage,
        @Size(max = 2000) String note) {
}
