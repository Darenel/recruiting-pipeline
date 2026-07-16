package dev.darenel.recruiting.applications;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.darenel.recruiting.catalog.PageResponse;
import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Company;
import dev.darenel.recruiting.domain.RecruitingApplication;
import dev.darenel.recruiting.domain.Role;
import dev.darenel.recruiting.domain.Stack;
import dev.darenel.recruiting.domain.Stage;
import dev.darenel.recruiting.domain.Vacancy;
import dev.darenel.recruiting.domain.VacancyStatus;
import dev.darenel.recruiting.security.JwtService;
import dev.darenel.recruiting.security.SecurityConfig;
import dev.darenel.recruiting.web.ApiExceptionHandler;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ApplicationsController.class)
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class ApplicationsControllerTest {

    private static final UUID APPLICATION_ID = UUID.fromString("00000000-0000-0000-0000-000000000401");

    @Autowired
    private MockMvc mvc;

    @MockBean
    private ApplicationsService service;

    @MockBean
    private JwtService jwtService;

    @Test
    @WithMockUser(roles = "RECRUITER")
    void recruiterCanCreateApplication() throws Exception {
        when(service.create(any(ApplicationCreateRequest.class))).thenReturn(applicationResponse());

        mvc.perform(post("/api/v1/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"candidateId":"00000000-0000-0000-0000-000000000301","vacancyId":"00000000-0000-0000-0000-000000000202"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(APPLICATION_ID.toString()))
                .andExpect(jsonPath("$.candidate.name").value("Ana Torres"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanCreateApplication() throws Exception {
        when(service.create(any(ApplicationCreateRequest.class))).thenReturn(applicationResponse());

        mvc.perform(post("/api/v1/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"candidateId":"00000000-0000-0000-0000-000000000301","vacancyId":"00000000-0000-0000-0000-000000000202"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.vacancy.title").value("Backend Engineer"));
    }

    @Test
    void unauthenticatedCannotCreateApplication() throws Exception {
        mvc.perform(post("/api/v1/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"candidateId":"00000000-0000-0000-0000-000000000301","vacancyId":"00000000-0000-0000-0000-000000000202"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @WithMockUser(roles = "VIEWER")
    void otherRolesCannotCreateApplication() throws Exception {
        mvc.perform(post("/api/v1/applications")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"candidateId":"00000000-0000-0000-0000-000000000301","vacancyId":"00000000-0000-0000-0000-000000000202"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void listsApplicationsWithFilters() throws Exception {
        when(service.list(eq(0), eq(20), eq(Stage.POSTULADO), any(), any(), eq(70)))
                .thenReturn(new PageResponse<>(List.of(applicationResponse()), 1, 0, 20));

        mvc.perform(get("/api/v1/applications?stage=POSTULADO&minScore=70"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].score").value(83))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void getsApplicationDetail() throws Exception {
        RecruitingApplication application = new RecruitingApplication(APPLICATION_ID, candidate(), vacancy(),
                Stage.POSTULADO, 83, OffsetDateTime.parse("2026-07-16T10:00:00Z"));
        when(service.get(APPLICATION_ID)).thenReturn(ApplicationDetailResponse.from(application, List.of(),
                List.of()));

        mvc.perform(get("/api/v1/applications/{id}", APPLICATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(APPLICATION_ID.toString()))
                .andExpect(jsonPath("$.history").isArray())
                .andExpect(jsonPath("$.interviews").isArray());
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void getsBoard() throws Exception {
        when(service.board(null)).thenReturn(new BoardResponse(List.of(
                new BoardColumnResponse(Stage.POSTULADO, List.of(
                        new BoardApplicationResponse(APPLICATION_ID, "Ana Torres", "Java engineer", 83, 2, 1))),
                new BoardColumnResponse(Stage.ENTREVISTA, List.of()),
                new BoardColumnResponse(Stage.PRUEBA_TECNICA, List.of()),
                new BoardColumnResponse(Stage.OFERTA, List.of()),
                new BoardColumnResponse(Stage.RECHAZADO, List.of()))));

        mvc.perform(get("/api/v1/applications/board"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.columns.length()").value(5))
                .andExpect(jsonPath("$.columns[0].applications[0].candidateName").value("Ana Torres"));
    }

    @Test
    @WithMockUser(username = "recruiter@recruiting.local", roles = "RECRUITER")
    void recruiterCanMoveStage() throws Exception {
        when(service.moveStage(eq(APPLICATION_ID), any(StageChangeRequest.class),
                eq("recruiter@recruiting.local"), eq(Role.RECRUITER))).thenReturn(applicationResponse());

        mvc.perform(patch("/api/v1/applications/{id}/stage", APPLICATION_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"toStage":"ENTREVISTA","note":"Ready for screening"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stage").value("POSTULADO"));
    }

    @Test
    @WithMockUser(username = "admin@recruiting.local", roles = "ADMIN")
    void adminCanMoveStage() throws Exception {
        when(service.moveStage(eq(APPLICATION_ID), any(StageChangeRequest.class),
                eq("admin@recruiting.local"), eq(Role.ADMIN))).thenReturn(applicationResponse());

        mvc.perform(patch("/api/v1/applications/{id}/stage", APPLICATION_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"toStage":"RECHAZADO"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(APPLICATION_ID.toString()));
    }

    @Test
    void unauthenticatedCannotMoveStage() throws Exception {
        mvc.perform(patch("/api/v1/applications/{id}/stage", APPLICATION_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"toStage":"ENTREVISTA"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void getsHistory() throws Exception {
        when(service.history(APPLICATION_ID)).thenReturn(List.of());

        mvc.perform(get("/api/v1/applications/{id}/history", APPLICATION_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @WithMockUser(username = "recruiter@recruiting.local", roles = "RECRUITER")
    void recruiterCanCreateInterview() throws Exception {
        when(service.createInterview(eq(APPLICATION_ID), any(InterviewCreateRequest.class),
                eq("recruiter@recruiting.local"))).thenReturn(new InterviewResponse(
                        UUID.fromString("00000000-0000-0000-0000-000000000501"),
                        APPLICATION_ID,
                        OffsetDateTime.parse("2026-07-20T15:00:00Z"),
                        dev.darenel.recruiting.domain.InterviewKind.TECHNICAL,
                        "Pairing session",
                        4,
                        UUID.fromString("00000000-0000-0000-0000-000000000002"),
                        "Maya Recruiter",
                        OffsetDateTime.parse("2026-07-16T11:00:00Z")));

        mvc.perform(post("/api/v1/applications/{id}/interviews", APPLICATION_ID)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"scheduledAt":"2026-07-20T15:00:00Z","kind":"TECHNICAL","notes":"Pairing session","rating":4}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(4));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminCanUpdateInterview() throws Exception {
        UUID interviewId = UUID.fromString("00000000-0000-0000-0000-000000000501");
        when(service.updateInterview(eq(interviewId), any(InterviewUpdateRequest.class))).thenReturn(
                new InterviewResponse(interviewId, APPLICATION_ID, OffsetDateTime.parse("2026-07-20T15:00:00Z"),
                        dev.darenel.recruiting.domain.InterviewKind.TECHNICAL, "Strong", 5,
                        UUID.fromString("00000000-0000-0000-0000-000000000001"), "Admin",
                        OffsetDateTime.parse("2026-07-16T11:00:00Z")));

        mvc.perform(patch("/api/v1/interviews/{id}", interviewId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"notes":"Strong","rating":5}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes").value("Strong"))
                .andExpect(jsonPath("$.rating").value(5));
    }

    @Test
    void unauthenticatedCannotUpdateInterview() throws Exception {
        mvc.perform(patch("/api/v1/interviews/{id}", UUID.fromString("00000000-0000-0000-0000-000000000501"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"notes":"Strong","rating":5}
                                """))
                .andExpect(status().isUnauthorized());
    }

    private ApplicationSummaryResponse applicationResponse() {
        return ApplicationSummaryResponse.from(new RecruitingApplication(APPLICATION_ID, candidate(), vacancy(),
                Stage.POSTULADO, 83, OffsetDateTime.parse("2026-07-16T10:00:00Z")));
    }

    private Candidate candidate() {
        return new Candidate(
                UUID.fromString("00000000-0000-0000-0000-000000000301"),
                "Ana Torres",
                "ana@example.com",
                "Java engineer",
                4,
                null,
                Set.of(Stack.JAVA),
                OffsetDateTime.parse("2026-07-16T09:00:00Z"));
    }

    private Vacancy vacancy() {
        return new Vacancy(
                UUID.fromString("00000000-0000-0000-0000-000000000202"),
                new Company(
                        UUID.fromString("00000000-0000-0000-0000-000000000201"),
                        "Nocturno Labs",
                        "Software",
                        OffsetDateTime.parse("2026-07-16T08:00:00Z")),
                "Backend Engineer",
                4,
                VacancyStatus.OPEN,
                Set.of(Stack.JAVA, Stack.SQL),
                OffsetDateTime.parse("2026-07-16T08:30:00Z"));
    }
}
