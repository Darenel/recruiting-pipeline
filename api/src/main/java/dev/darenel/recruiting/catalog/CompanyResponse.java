package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Company;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.OffsetDateTime;
import java.util.UUID;

@Schema(name = "Company")
public record CompanyResponse(
        UUID id,
        String name,
        String industry,
        OffsetDateTime createdAt) {

    static CompanyResponse from(Company company) {
        return new CompanyResponse(company.getId(), company.getName(), company.getIndustry(), company.getCreatedAt());
    }
}
