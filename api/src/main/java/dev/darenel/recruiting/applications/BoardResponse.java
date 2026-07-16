package dev.darenel.recruiting.applications;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(name = "ApplicationBoard")
public record BoardResponse(List<BoardColumnResponse> columns) {
}
