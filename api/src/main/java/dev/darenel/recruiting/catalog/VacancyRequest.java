package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.VacancyStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.Set;
import java.util.UUID;

@Schema(name = "VacancyRequest")
public record VacancyRequest(
        @NotNull UUID companyId,
        @NotBlank String title,
        @Min(0) int seniorityYears,
        @NotNull VacancyStatus status,
        @NotEmpty Set<Stack> stacks) {
}
