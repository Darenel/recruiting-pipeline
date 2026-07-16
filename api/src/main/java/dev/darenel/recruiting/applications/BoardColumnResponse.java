package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.domain.Stage;
import java.util.List;

public record BoardColumnResponse(
        Stage stage,
        List<BoardApplicationResponse> applications) {
}
