package dev.darenel.recruiting.catalog;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.darenel.recruiting.domain.Candidate;
import dev.darenel.recruiting.domain.Stack;
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

@WebMvcTest(CandidateController.class)
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class CandidateControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private CandidateService service;

    @MockBean
    private JwtService jwtService;

    @Test
    @WithMockUser(roles = "RECRUITER")
    void recruiterCanCreateCandidate() throws Exception {
        CandidateResponse candidate = CandidateResponse.from(new Candidate(
                UUID.fromString("00000000-0000-0000-0000-000000000301"),
                "Ana Torres",
                "ana@example.com",
                "React engineer",
                4,
                "Testing",
                Set.of(Stack.REACT),
                OffsetDateTime.parse("2026-07-16T10:00:00Z")));
        when(service.create(any(CandidateRequest.class))).thenReturn(candidate);

        mvc.perform(post("/api/v1/candidates")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("ana@example.com"));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void listsCandidates() throws Exception {
        CandidateResponse candidate = CandidateResponse.from(new Candidate(
                UUID.fromString("00000000-0000-0000-0000-000000000301"),
                "Ana Torres",
                "ana@example.com",
                "React engineer",
                4,
                "Testing",
                Set.of(Stack.REACT),
                OffsetDateTime.parse("2026-07-16T10:00:00Z")));
        when(service.list(eq(0), eq(20), any(), any(), any(), any(), eq("createdAt"), eq("desc")))
                .thenReturn(new PageResponse<>(List.of(candidate), 1, 0, 20));

        mvc.perform(get("/api/v1/candidates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Ana Torres"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void validatesCreateCandidate() throws Exception {
        mvc.perform(post("/api/v1/candidates")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","email":"bad","headline":"","yearsExperience":-1,"stacks":[]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    private String validRequest() {
        return """
                {"name":"Ana Torres","email":"ana@example.com","headline":"React engineer","yearsExperience":4,"extraSkills":"Testing","stacks":["REACT"]}
                """;
    }
}
