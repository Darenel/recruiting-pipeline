package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.RecruitingApplication;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.StageEvent;
import dev.darenel.recruiting.domain.Interview;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Schema(name = "ApplicationDetail")
public record ApplicationDetailResponse(
        UUID id,
        Stage stage,
        int score,
        CandidateSummaryResponse candidate,
        VacancySummaryResponse vacancy,
        OffsetDateTime createdAt,
        List<StageEventResponse> history,
        List<InterviewResponse> interviews) {

    static ApplicationDetailResponse from(RecruitingApplication application, List<StageEvent> history,
            List<Interview> interviews) {
        return new ApplicationDetailResponse(
                application.getId(),
                application.getStage(),
                application.getScore(),
                CandidateSummaryResponse.from(application.getCandidate()),
                VacancySummaryResponse.from(application.getVacancy()),
                application.getCreatedAt(),
                history.stream().map(StageEventResponse::from).toList(),
                interviews.stream().map(InterviewResponse::from).toList());
    }
}
