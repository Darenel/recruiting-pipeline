package dev.darenel.recruiting.applications;

import java.util.UUID;

public record BoardApplicationResponse(
        UUID id,
        String candidateName,
        String headline,
        int score,
        long daysInStage,
        int interviewCount) {
}
