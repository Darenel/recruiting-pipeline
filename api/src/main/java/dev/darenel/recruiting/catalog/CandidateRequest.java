package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Stack;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.Set;

@Schema(name = "CandidateRequest")
public record CandidateRequest(
        @NotBlank String name,
        @Email @NotBlank String email,
        @NotBlank String headline,
        @Min(0) int yearsExperience,
        String extraSkills,
        @NotEmpty Set<Stack> stacks) {
}
