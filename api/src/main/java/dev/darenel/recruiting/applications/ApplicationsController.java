package dev.darenel.recruiting.applications;

import dev.darenel.recruiting.catalog.PageResponse;
import dev.darenel.recruiting.domain.Role;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.web.ApiPaths;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
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
@RequestMapping(ApiPaths.V1)
@Tag(name = "Applications")
public class ApplicationsController {

    private final ApplicationsService service;

    public ApplicationsController(ApplicationsService service) {
        this.service = service;
    }

    @PostMapping("/applications")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Create an application")
    public ApplicationSummaryResponse create(@Valid @RequestBody ApplicationCreateRequest request) {
        return service.create(request);
    }

    @GetMapping("/applications")
    @Operation(summary = "List applications")
    public PageResponse<ApplicationSummaryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false) Stage stage,
            @RequestParam(required = false) UUID vacancyId,
            @RequestParam(required = false) UUID candidateId,
            @RequestParam(required = false) Integer minScore) {
        return service.list(page, limit, stage, vacancyId, candidateId, minScore);
    }

    @GetMapping("/applications/{id}")
    @Operation(summary = "Get an application")
    public ApplicationDetailResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @GetMapping("/applications/board")
    @Operation(summary = "Get the application board")
    public BoardResponse board(@RequestParam(required = false) UUID vacancyId) {
        return service.board(vacancyId);
    }

    @PatchMapping("/applications/{id}/stage")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Move an application to another stage")
    public ApplicationSummaryResponse moveStage(@PathVariable UUID id, @Valid @RequestBody StageChangeRequest request,
            Authentication authentication) {
        return service.moveStage(id, request, authentication.getName(), role(authentication));
    }

    @GetMapping("/applications/{id}/history")
    @Operation(summary = "Get application stage history")
    public List<StageEventResponse> history(@PathVariable UUID id) {
        return service.history(id);
    }

    @PostMapping("/applications/{id}/interviews")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Create an interview")
    public InterviewResponse createInterview(@PathVariable UUID id,
            @Valid @RequestBody InterviewCreateRequest request, Authentication authentication) {
        return service.createInterview(id, request, authentication.getName());
    }

    @PatchMapping("/interviews/{id}")
    @PreAuthorize("hasAnyRole('RECRUITER', 'ADMIN')")
    @Operation(summary = "Update an interview")
    public InterviewResponse updateInterview(@PathVariable UUID id,
            @Valid @RequestBody InterviewUpdateRequest request) {
        return service.updateInterview(id, request);
    }

    private Role role(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(authority -> authority.startsWith("ROLE_"))
                .map(authority -> Role.valueOf(authority.substring(5)))
                .findFirst()
                .orElse(Role.RECRUITER);
    }
}
