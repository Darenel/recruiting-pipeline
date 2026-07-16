package dev.darenel.recruiting.dashboard;

import java.time.LocalDate;

public record DashboardTimelineResponse(LocalDate date, long applications, long offers) {
}
