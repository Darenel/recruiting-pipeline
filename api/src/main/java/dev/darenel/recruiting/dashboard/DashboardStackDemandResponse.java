package dev.darenel.recruiting.dashboard;

import dev.darenel.recruiting.domain.Stack;

public record DashboardStackDemandResponse(Stack stack, long openVacancies, long activeApplications) {
}
