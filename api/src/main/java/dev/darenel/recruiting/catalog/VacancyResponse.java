package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Vacancy;
import dev.darenel.recruiting.domain.VacancyStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Schema(name = "Vacancy")
public record VacancyResponse(
        UUID id,
        UUID companyId,
        String companyName,
        String title,
        int seniorityYears,
        VacancyStatus status,
        Set<Stack> stacks,
        OffsetDateTime createdAt) {

    static VacancyResponse from(Vacancy vacancy) {
        return new VacancyResponse(
                vacancy.getId(),
                vacancy.getCompany().getId(),
                vacancy.getCompany().getName(),
                vacancy.getTitle(),
                vacancy.getSeniorityYears(),
                vacancy.getStatus(),
                vacancy.getStacks(),
                vacancy.getCreatedAt());
    }
}
