package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.Candidate;
import java.util.UUID;

public record CandidateSummaryResponse(
        UUID id,
        String name,
        String headline) {

    static CandidateSummaryResponse from(Candidate candidate) {
        return new CandidateSummaryResponse(candidate.getId(), candidate.getName(), candidate.getHeadline());
    }
}
