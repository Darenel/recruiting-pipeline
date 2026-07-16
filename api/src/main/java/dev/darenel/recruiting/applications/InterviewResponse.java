package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.Interview;
import dev.darenel.recruiting.domain.InterviewKind;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;

@Schema(name = "Interview")
public record InterviewResponse(
        UUID id,
        UUID applicationId,
        OffsetDateTime scheduledAt,
        InterviewKind kind,
        String notes,
        Integer rating,
        UUID byUserId,
        String byUserName,
        OffsetDateTime createdAt) {

    static InterviewResponse from(Interview interview) {
        return new InterviewResponse(
                interview.getId(),
                interview.getApplication().getId(),
                interview.getScheduledAt(),
                interview.getKind(),
                interview.getNotes(),
                interview.getRating(),
                interview.getByUser().getId(),
                interview.getByUser().getName(),
                interview.getCreatedAt());
    }
}
