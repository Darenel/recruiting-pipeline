package dev.darenel.recruiting.dashboard;

import dev.darenel.recruiting.domain.Stage;

public record DashboardFunnelResponse(Stage stage, long count, double conversionPct) {
}
