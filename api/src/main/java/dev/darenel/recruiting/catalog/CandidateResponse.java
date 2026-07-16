package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Stack;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Schema(name = "Candidate")
public record CandidateResponse(
        UUID id,
        String name,
        String email,
        String headline,
        int yearsExperience,
        String extraSkills,
        Set<Stack> stacks,
        OffsetDateTime createdAt) {

    static CandidateResponse from(Candidate candidate) {
        return new CandidateResponse(
                candidate.getId(),
                candidate.getName(),
                candidate.getEmail(),
                candidate.getHeadline(),
                candidate.getYearsExperience(),
                candidate.getExtraSkills(),
                candidate.getStacks(),
                candidate.getCreatedAt());
    }
}
