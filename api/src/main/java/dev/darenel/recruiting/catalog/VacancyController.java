package dev.darenel.recruiting.catalog;

import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.VacancyStatus;
import dev.darenel.recruiting.web.ApiPaths;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.V1 + "/vacancies")
@Tag(name = "Vacancies")
public class VacancyController {

    private final VacancyService service;

    public VacancyController(VacancyService service) {
        this.service = service;
    }

    @GetMapping
    @Operation(summary = "List vacancies")
    public PageResponse<VacancyResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Stack stack,
            @RequestParam(required = false) VacancyStatus status,
            @RequestParam(required = false) UUID companyId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        return service.list(page, limit, stack, status, companyId, search, sortBy, sortDir);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a vacancy")
    public VacancyResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a vacancy")
    public VacancyResponse create(@Valid @RequestBody VacancyRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a vacancy")
    public VacancyResponse update(@PathVariable UUID id, @Valid @RequestBody VacancyRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a vacancy")
    public void delete(@PathVariable UUID id) {
        service.delete(id);
    }
}
