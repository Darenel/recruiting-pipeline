package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.InterviewKind;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;

public record InterviewCreateRequest(
        @NotNull OffsetDateTime scheduledAt,
        @NotNull InterviewKind kind,
        @Size(max = 4000) String notes,
        @Min(1) @Max(5) Integer rating) {
}
