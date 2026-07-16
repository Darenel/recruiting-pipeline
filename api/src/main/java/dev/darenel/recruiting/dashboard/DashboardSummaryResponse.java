package dev.darenel.recruiting.dashboard;

import dev.darenel.recruiting.domain.Stage;
import java.util.Map;

public record DashboardSummaryResponse(
        long openVacancies,
        long totalCandidates,
        long activeApplications,
        long offersThisMonth,
        long rejectedThisMonth,
        double avgScoreActive,
        Map<Stage, Long> applicationsByStage) {
}
