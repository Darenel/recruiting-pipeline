package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.RecruitingApplication;
import dev.darenel.recruiting.domain.Stage;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;

@Schema(name = "ApplicationSummary")
public record ApplicationSummaryResponse(
        UUID id,
        Stage stage,
        int score,
        CandidateSummaryResponse candidate,
        VacancySummaryResponse vacancy,
        OffsetDateTime createdAt) {

    static ApplicationSummaryResponse from(RecruitingApplication application) {
        return new ApplicationSummaryResponse(
                application.getId(),
                application.getStage(),
                application.getScore(),
                CandidateSummaryResponse.from(application.getCandidate()),
                VacancySummaryResponse.from(application.getVacancy()),
                application.getCreatedAt());
    }
}
