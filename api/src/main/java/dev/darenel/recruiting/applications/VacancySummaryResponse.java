package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.Vacancy;
import dev.darenel.recruiting.domain.VacancyStatus;
import java.util.UUID;

public record VacancySummaryResponse(
        UUID id,
        String title,
        UUID companyId,
        String companyName,
        VacancyStatus status) {

    static VacancySummaryResponse from(Vacancy vacancy) {
        return new VacancySummaryResponse(
                vacancy.getId(),
                vacancy.getTitle(),
                vacancy.getCompany().getId(),
                vacancy.getCompany().getName(),
                vacancy.getStatus());
    }
}
