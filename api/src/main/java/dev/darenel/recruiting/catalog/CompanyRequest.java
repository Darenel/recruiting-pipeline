package dev.darenel.recruiting.catalog;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

@Schema(name = "CompanyRequest")
public record CompanyRequest(
        @Schema(example = "Nocturno Labs")
        @NotBlank String name,
        @Schema(example = "Software")
        @NotBlank String industry) {
}
