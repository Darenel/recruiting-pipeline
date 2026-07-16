package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.StageEvent;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;

@Schema(name = "StageEvent")
public record StageEventResponse(
        UUID id,
        Stage fromStage,
        Stage toStage,
        UUID byUserId,
        String byUserName,
        String note,
        OffsetDateTime createdAt) {

    static StageEventResponse from(StageEvent event) {
        return new StageEventResponse(
                event.getId(),
                event.getFromStage(),
                event.getToStage(),
                event.getByUser().getId(),
                event.getByUser().getName(),
                event.getNote(),
                event.getCreatedAt());
    }
}
