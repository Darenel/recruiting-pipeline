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
import dev.darenel.recruiting.security.JwtService;
import dev.darenel.recruiting.security.SecurityConfig;
import dev.darenel.recruiting.web.ApiExceptionHandler;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CompanyController.class)
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class CompanyControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private CompanyService service;

    @MockBean
    private JwtService jwtService;

    @Test
    @WithMockUser(roles = "RECRUITER")
    void recruiterCannotCreateCompany() throws Exception {
        mvc.perform(post("/api/v1/companies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Nocturno Labs","industry":"Software"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @WithMockUser(roles = "RECRUITER")
    void listsCompanies() throws Exception {
        CompanyResponse company = CompanyResponse.from(new Company(
                UUID.fromString("00000000-0000-0000-0000-000000000101"),
                "Nocturno Labs",
                "Software",
                OffsetDateTime.parse("2026-07-16T10:00:00Z")));
        when(service.list(eq(0), eq(20), any(), eq("createdAt"), eq("desc")))
                .thenReturn(new PageResponse<>(List.of(company), 1, 0, 20));

        mvc.perform(get("/api/v1/companies"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].name").value("Nocturno Labs"))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.limit").value(20));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void validatesCreateCompany() throws Exception {
        mvc.perform(post("/api/v1/companies")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","industry":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors").isArray());
    }
}
