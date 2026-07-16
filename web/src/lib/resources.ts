import { api, Page } from "./api";
import {
  ApplicationDetail,
  ApplicationSummary,
  Board,
  Candidate,
  CandidateRequest,
  Company,
  CompanyRequest,
  DashboardFunnelItem,
  DashboardStackDemandItem,
  DashboardSummary,
  DashboardTimelineItem,
  Interview,
  InterviewKind,
  Stack,
  Stage,
  UUID,
  Vacancy,
  VacancyRequest,
  VacancyStatus,
} from "./types";

function params(values: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : "";
}

export type ListParams = {
  page?: number;
  limit?: number;
  search?: string;
  stack?: Stack | "";
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export const resources = {
  candidates: {
    list: (filters: ListParams & { minYears?: number; maxYears?: number }) =>
      api<Page<Candidate>>(`/candidates${params(filters)}`),
    create: (body: CandidateRequest) => api<Candidate>("/candidates", { method: "POST", body }),
    update: (id: UUID, body: CandidateRequest) => api<Candidate>(`/candidates/${id}`, { method: "PATCH", body }),
    remove: (id: UUID) => api<void>(`/candidates/${id}`, { method: "DELETE" }),
  },
  companies: {
    list: (filters: Omit<ListParams, "stack">) => api<Page<Company>>(`/companies${params(filters)}`),
    create: (body: CompanyRequest) => api<Company>("/companies", { method: "POST", body }),
    update: (id: UUID, body: CompanyRequest) => api<Company>(`/companies/${id}`, { method: "PATCH", body }),
    remove: (id: UUID) => api<void>(`/companies/${id}`, { method: "DELETE" }),
  },
  vacancies: {
    list: (filters: ListParams & { status?: VacancyStatus | ""; companyId?: UUID | "" }) =>
      api<Page<Vacancy>>(`/vacancies${params(filters)}`),
    create: (body: VacancyRequest) => api<Vacancy>("/vacancies", { method: "POST", body }),
    update: (id: UUID, body: VacancyRequest) => api<Vacancy>(`/vacancies/${id}`, { method: "PATCH", body }),
    remove: (id: UUID) => api<void>(`/vacancies/${id}`, { method: "DELETE" }),
  },
  applications: {
    create: (candidateId: UUID, vacancyId: UUID) =>
      api<ApplicationSummary>("/applications", { method: "POST", body: { candidateId, vacancyId } }),
    board: (vacancyId?: UUID | "") => api<Board>(`/applications/board${params({ vacancyId })}`),
    get: (id: UUID) => api<ApplicationDetail>(`/applications/${id}`),
    move: (id: UUID, toStage: Stage, note: string) =>
      api<ApplicationSummary>(`/applications/${id}/stage`, { method: "PATCH", body: { toStage, note } }),
    addInterview: (
      id: UUID,
      body: { scheduledAt: string; kind: InterviewKind; notes: string; rating: number | null },
    ) => api<Interview>(`/applications/${id}/interviews`, { method: "POST", body }),
  },
  dashboard: {
    summary: () => api<DashboardSummary>("/dashboard/summary"),
    funnel: () => api<DashboardFunnelItem[]>("/dashboard/funnel"),
    stackDemand: () => api<DashboardStackDemandItem[]>("/dashboard/stack-demand"),
    timeline: (days: number) => api<DashboardTimelineItem[]>(`/dashboard/timeline${params({ days })}`),
  },
};
