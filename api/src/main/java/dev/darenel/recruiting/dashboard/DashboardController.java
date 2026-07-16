package dev.darenel.recruiting.dashboard;

import dev.darenel.recruiting.web.ApiPaths;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(ApiPaths.V1 + "/dashboard")
@Tag(name = "Dashboard")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary metrics")
    public DashboardSummaryResponse summary() {
        return service.summary();
    }

    @GetMapping("/funnel")
    @Operation(summary = "Get application funnel metrics")
    public List<DashboardFunnelResponse> funnel() {
        return service.funnel();
    }

    @GetMapping("/stack-demand")
    @Operation(summary = "Get stack demand metrics")
    public List<DashboardStackDemandResponse> stackDemand() {
        return service.stackDemand();
    }

    @GetMapping("/timeline")
    @Operation(summary = "Get application and offer timeline")
    public List<DashboardTimelineResponse> timeline(@RequestParam(defaultValue = "30") int days) {
        return service.timeline(days);
    }
}
