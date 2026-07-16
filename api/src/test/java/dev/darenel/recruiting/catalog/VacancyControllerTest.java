package dev.darenel.recruiting.catalog;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.darenel.recruiting.domain.Company;
import dev.darenel.recruiting.domain.Stack;
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

@WebMvcTest(VacancyController.class)
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class VacancyControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private VacancyService service;

    @MockBean
    private JwtService jwtService;

    @Test
    @WithMockUser(roles = "RECRUITER")
    void recruiterCannotCreateVacancy() throws Exception {
        mvc.perform(post("/api/v1/vacancies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void listsVacancies() throws Exception {
        Company company = new Company(UUID.fromString("00000000-0000-0000-0000-000000000201"),
                "Nocturno Labs", "Software", OffsetDateTime.parse("2026-07-16T10:00:00Z"));
        VacancyResponse vacancy = VacancyResponse.from(new Vacancy(
                UUID.fromString("00000000-0000-0000-0000-000000000202"),
                company,
                "Backend Engineer",
                4,
                VacancyStatus.OPEN,
                Set.of(Stack.JAVA, Stack.SQL),
                OffsetDateTime.parse("2026-07-16T10:10:00Z")));
        when(service.list(eq(0), eq(20), any(), any(), any(), any(), eq("createdAt"), eq("desc")))
                .thenReturn(new PageResponse<>(List.of(vacancy), 1, 0, 20));

        mvc.perform(get("/api/v1/vacancies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].title").value("Backend Engineer"))
                .andExpect(jsonPath("$.data[0].status").value("OPEN"))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void validatesCreateVacancy() throws Exception {
        mvc.perform(post("/api/v1/vacancies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"companyId":null,"title":"","seniorityYears":-1,"status":null,"stacks":[]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    private String validRequest() {
        return """
                {"companyId":"00000000-0000-0000-0000-000000000201","title":"Backend Engineer","seniorityYears":4,"status":"OPEN","stacks":["JAVA","SQL"]}
                """;
    }
}
