package dev.darenel.recruiting.dashboard;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.darenel.recruiting.security.JwtService;
import dev.darenel.recruiting.security.SecurityConfig;
import dev.darenel.recruiting.web.ApiExceptionHandler;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DashboardController.class)
@Import({SecurityConfig.class, ApiExceptionHandler.class})
class DashboardControllerTest {

    @Autowired
    private MockMvc mvc;

    @MockBean
    private DashboardService service;

    @MockBean
    private JwtService jwtService;

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/v1/dashboard/summary",
            "/api/v1/dashboard/funnel",
            "/api/v1/dashboard/stack-demand",
            "/api/v1/dashboard/timeline?days=30"
    })
    void dashboardEndpointsRequireAuthentication(String path) throws Exception {
        mvc.perform(get(path))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
