package dev.darenel.recruiting.applications;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record InterviewUpdateRequest(
        @Size(max = 4000) String notes,
        @Min(1) @Max(5) Integer rating) {
}
