import { readAuthSession } from "../auth/storage";
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
  StageEvent,
  Vacancy,
  VacancyRequest,
  VacancyStatus,
  stages,
  stacks,
} from "../lib/types";
import { createDemoState, DemoApplication, demoUserIds, scoreCandidate } from "./data";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

type Body = Record<string, unknown>;
type SortDir = "asc" | "desc";
type Collection = "candidates" | "companies" | "vacancies";
type Entity = Candidate | Company | Vacancy;

export class DemoRequestError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "DemoRequestError";
    this.status = status;
  }
}

const state = createDemoState();
const activeStages: Stage[] = ["POSTULADO", "ENTREVISTA", "PRUEBA_TECNICA"];
const forwardStages: Stage[] = ["POSTULADO", "ENTREVISTA", "PRUEBA_TECNICA", "OFERTA"];
const nextStage: Partial<Record<Stage, Stage>> = {
  POSTULADO: "ENTREVISTA",
  ENTREVISTA: "PRUEBA_TECNICA",
  PRUEBA_TECNICA: "OFERTA",
};

function stamp() {
  return new Date().toISOString();
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function route(path: string) {
  return new URL(path, "https://demo.recruiting.local");
}

function requireBody(options: RequestOptions): Body {
  return (options.body ?? {}) as Body;
}

function pageParam(url: URL) {
  return Math.max(Number(url.searchParams.get("page") ?? 0), 0);
}

function limitParam(url: URL) {
  const limit = Number(url.searchParams.get("limit") ?? 20);
  return limit < 1 ? 20 : Math.min(limit, 100);
}

function searchText(item: Record<string, unknown>) {
  return Object.values(item)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();
}

function compareValues<T extends Record<string, unknown>>(left: T, right: T, sortBy: string, sortDir: SortDir) {
  const leftValue = left[sortBy];
  const rightValue = right[sortBy];
  const leftNumber = Number(leftValue);
  const rightNumber = Number(rightValue);
  const numeric = Number.isFinite(leftNumber) && Number.isFinite(rightNumber);
  const leftComparable = numeric ? leftNumber : String(leftValue ?? "").toLowerCase();
  const rightComparable = numeric ? rightNumber : String(rightValue ?? "").toLowerCase();

  if (leftComparable < rightComparable) {
    return sortDir === "asc" ? -1 : 1;
  }
  if (leftComparable > rightComparable) {
    return sortDir === "asc" ? 1 : -1;
  }
  return 0;
}

function list<T extends Record<string, unknown>>(items: T[], url: URL, defaultSortBy = "createdAt") {
  const page = pageParam(url);
  const limit = limitParam(url);
  const sortBy = url.searchParams.get("sortBy") ?? defaultSortBy;
  const sortDir = (url.searchParams.get("sortDir") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";
  const sorted = [...items].sort((left, right) => compareValues(left, right, sortBy, sortDir));
  const start = page * limit;

  return {
    data: sorted.slice(start, start + limit),
    total: sorted.length,
    page,
    limit,
  };
}

function currentRole() {
  return readAuthSession()?.user.role ?? "RECRUITER";
}

function currentUser() {
  return readAuthSession()?.user ?? state.users[0];
}

function requireAdmin() {
  if (currentRole() !== "ADMIN") {
    throw new DemoRequestError(403, "Forbidden");
  }
}

function collection(name: Collection) {
  return state[name] as Entity[];
}

function companyName(companyId: string) {
  return state.companies.find((company) => company.id === companyId)?.name ?? "";
}

function candidate(idValue: string) {
  const found = state.candidates.find((item) => item.id === idValue);
  if (!found) {
    throw new DemoRequestError(404, "Candidate not found");
  }
  return found;
}

function vacancy(idValue: string) {
  const found = state.vacancies.find((item) => item.id === idValue);
  if (!found) {
    throw new DemoRequestError(404, "Vacancy not found");
  }
  return found;
}

function application(idValue: string) {
  const found = state.applications.find((item) => item.id === idValue);
  if (!found) {
    throw new DemoRequestError(404, "Application not found");
  }
  return found;
}

function summary(applicationItem: DemoApplication): ApplicationSummary {
  const appCandidate = candidate(applicationItem.candidateId);
  const appVacancy = vacancy(applicationItem.vacancyId);

  return {
    id: applicationItem.id,
    stage: applicationItem.stage,
    score: applicationItem.score,
    candidate: {
      id: appCandidate.id,
      name: appCandidate.name,
      headline: appCandidate.headline,
      stacks: [...appCandidate.stacks],
      yearsExperience: appCandidate.yearsExperience,
    },
    vacancy: {
      id: appVacancy.id,
      title: appVacancy.title,
      companyName: appVacancy.companyName,
      stacks: [...appVacancy.stacks],
      seniorityYears: appVacancy.seniorityYears,
      status: appVacancy.status,
    },
    createdAt: applicationItem.createdAt,
  };
}

function detail(idValue: string): ApplicationDetail {
  const item = application(idValue);
  return {
    ...summary(item),
    history: state.stageEvents
      .filter((event) => event.id && event.byUserId && event.toStage && event.id && event.id && event)
      .filter((event) => applicationEventId(event) === item.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    interviews: state.interviews
      .filter((interview) => interview.applicationId === item.id)
      .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt)),
  };
}

function applicationEventId(event: StageEvent) {
  return (event as StageEvent & { applicationId?: string }).applicationId ?? "";
}

function eventForApplication(event: StageEvent, applicationId: string) {
  (event as StageEvent & { applicationId: string }).applicationId = applicationId;
  return event;
}

state.stageEvents = state.stageEvents.map((event) => {
  const parts = event.id.split("-");
  const index = Number(parts[3]) - 1;
  return eventForApplication(event, state.applications[index]?.id ?? "");
});

function daysInStage(applicationItem: DemoApplication) {
  const lastEvent = state.stageEvents
    .filter((event) => applicationEventId(event) === applicationItem.id && event.toStage === applicationItem.stage)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  const since = new Date(lastEvent?.createdAt ?? applicationItem.createdAt);
  return Math.max(0, Math.floor((Date.now() - since.getTime()) / 86_400_000));
}

function board(url: URL): Board {
  const vacancyId = url.searchParams.get("vacancyId");
  const source = state.applications
    .filter((item) => !vacancyId || item.vacancyId === vacancyId)
    .sort((left, right) => right.score - left.score);

  return {
    columns: stages.map((stage) => ({
      stage,
      applications: source
        .filter((item) => item.stage === stage)
        .map((item) => {
          const appCandidate = candidate(item.candidateId);
          return {
            id: item.id,
            candidateName: appCandidate.name,
            headline: appCandidate.headline,
            score: item.score,
            daysInStage: daysInStage(item),
            interviewCount: state.interviews.filter((interview) => interview.applicationId === item.id).length,
          };
        }),
    })),
  };
}

function validateTransition(from: Stage, to: Stage) {
  if (from === to) {
    throw new DemoRequestError(409, `Application is already in stage ${to}`);
  }
  if (from === "RECHAZADO" && to === "POSTULADO" && currentRole() === "ADMIN") {
    return;
  }
  if (from === "OFERTA" || from === "RECHAZADO") {
    throw new DemoRequestError(409, "Application is in a terminal stage");
  }
  if (to === "RECHAZADO") {
    return;
  }
  if (nextStage[from] === to) {
    return;
  }
  throw new DemoRequestError(409, `Illegal stage transition from ${from} to ${to}`);
}

function moveStage(idValue: string, body: Body) {
  const item = application(idValue);
  const toStage = String(body.toStage ?? "") as Stage;
  if (!stages.includes(toStage)) {
    throw new DemoRequestError(400, "Stage is required");
  }

  const fromStage = item.stage;
  validateTransition(fromStage, toStage);
  item.stage = toStage;
  const user = currentUser();
  state.stageEvents.unshift(eventForApplication({
    id: id("evt"),
    fromStage,
    toStage,
    byUserId: user.role === "ADMIN" ? demoUserIds.admin : demoUserIds.recruiter,
    byUserName: user.name,
    note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
    createdAt: stamp(),
  }, item.id));

  return summary(item);
}

function guardInterviewStage(stage: Stage) {
  if (stage !== "ENTREVISTA" && stage !== "PRUEBA_TECNICA") {
    throw new DemoRequestError(409, "Interviews are only allowed during ENTREVISTA or PRUEBA_TECNICA");
  }
}

function createInterview(applicationId: string, body: Body) {
  const item = application(applicationId);
  guardInterviewStage(item.stage);
  const user = currentUser();
  const interview: Interview = {
    id: id("int"),
    applicationId,
    scheduledAt: String(body.scheduledAt ?? stamp()),
    kind: String(body.kind ?? "PHONE") as InterviewKind,
    notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    rating: body.rating === null || body.rating === undefined || body.rating === "" ? null : Number(body.rating),
    byUserId: user.role === "ADMIN" ? demoUserIds.admin : demoUserIds.recruiter,
    byUserName: user.name,
    createdAt: stamp(),
  };
  state.interviews.push(interview);
  return interview;
}

function updateInterview(interviewId: string, body: Body) {
  const item = state.interviews.find((interview) => interview.id === interviewId);
  if (!item) {
    throw new DemoRequestError(404, "Interview not found");
  }
  item.notes = typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null;
  item.rating = body.rating === null || body.rating === undefined || body.rating === "" ? null : Number(body.rating);
  return item;
}

function validStacks(value: unknown) {
  const values = Array.isArray(value) ? value : [];
  return values.filter((item): item is Stack => stacks.includes(item as Stack));
}

function createCandidate(body: Body) {
  const createdAt = stamp();
  const item: Candidate = {
    id: id("cand"),
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase(),
    headline: String(body.headline ?? "").trim(),
    yearsExperience: Number(body.yearsExperience ?? 0),
    extraSkills: String(body.extraSkills ?? "").trim() || null,
    stacks: validStacks(body.stacks),
    createdAt,
  };
  if (!item.name || !item.email || !item.headline || item.stacks.length === 0) {
    throw new DemoRequestError(400, "Validation failed");
  }
  state.candidates.unshift(item);
  return item;
}

function updateCandidate(idValue: string, body: Body) {
  const index = state.candidates.findIndex((item) => item.id === idValue);
  if (index < 0) {
    throw new DemoRequestError(404, "Candidate not found");
  }
  const next: Candidate = { ...state.candidates[index], ...createCandidateShape(body) };
  state.candidates[index] = next;
  recomputeCandidateScores(next.id);
  return next;
}

function createCandidateShape(body: Body): CandidateRequest {
  return {
    name: String(body.name ?? "").trim(),
    email: String(body.email ?? "").trim().toLowerCase(),
    headline: String(body.headline ?? "").trim(),
    yearsExperience: Number(body.yearsExperience ?? 0),
    extraSkills: String(body.extraSkills ?? "").trim(),
    stacks: validStacks(body.stacks),
  };
}

function createCompany(body: Body) {
  const item: Company = {
    id: id("co"),
    name: String(body.name ?? "").trim(),
    industry: String(body.industry ?? "").trim(),
    createdAt: stamp(),
  };
  if (!item.name || !item.industry) {
    throw new DemoRequestError(400, "Validation failed");
  }
  state.companies.unshift(item);
  return item;
}

function updateCompany(idValue: string, body: Body) {
  const index = state.companies.findIndex((item) => item.id === idValue);
  if (index < 0) {
    throw new DemoRequestError(404, "Company not found");
  }
  const item = {
    ...state.companies[index],
    name: String(body.name ?? "").trim(),
    industry: String(body.industry ?? "").trim(),
  };
  state.companies[index] = item;
  state.vacancies.forEach((vacancyItem) => {
    if (vacancyItem.companyId === item.id) {
      vacancyItem.companyName = item.name;
    }
  });
  return item;
}

function createVacancy(body: Body) {
  const item = createVacancyShape(body, id("vac"), stamp());
  state.vacancies.unshift(item);
  return item;
}

function createVacancyShape(body: Body, idValue: string, createdAt: string): Vacancy {
  const companyId = String(body.companyId ?? "");
  const item: Vacancy = {
    id: idValue,
    companyId,
    companyName: companyName(companyId),
    title: String(body.title ?? "").trim(),
    seniorityYears: Number(body.seniorityYears ?? 0),
    status: String(body.status ?? "OPEN") as VacancyStatus,
    stacks: validStacks(body.stacks),
    createdAt,
  };
  if (!item.companyId || !item.companyName || !item.title || item.stacks.length === 0) {
    throw new DemoRequestError(400, "Validation failed");
  }
  return item;
}

function updateVacancy(idValue: string, body: Body) {
  const index = state.vacancies.findIndex((item) => item.id === idValue);
  if (index < 0) {
    throw new DemoRequestError(404, "Vacancy not found");
  }
  const next = createVacancyShape(body, idValue, state.vacancies[index].createdAt);
  state.vacancies[index] = next;
  recomputeVacancyScores(next.id);
  return next;
}

function removeEntity(name: Collection, idValue: string) {
  if (name === "candidates" && state.applications.some((item) => item.candidateId === idValue)) {
    throw new DemoRequestError(409, "Cannot delete candidate while applications reference it");
  }
  if (name === "vacancies" && state.applications.some((item) => item.vacancyId === idValue)) {
    throw new DemoRequestError(409, "Cannot delete vacancy while applications reference it");
  }
  if (name === "companies" && state.vacancies.some((item) => item.companyId === idValue)) {
    throw new DemoRequestError(409, "Cannot delete company while vacancies reference it");
  }
  const items = collection(name);
  const index = items.findIndex((item) => item.id === idValue);
  if (index < 0) {
    throw new DemoRequestError(404, "Record not found");
  }
  items.splice(index, 1);
}

function recomputeCandidateScores(candidateId: string) {
  state.applications
    .filter((item) => item.candidateId === candidateId)
    .forEach((item) => {
      item.score = scoreCandidate(vacancy(item.vacancyId), candidate(candidateId));
    });
}

function recomputeVacancyScores(vacancyId: string) {
  state.applications
    .filter((item) => item.vacancyId === vacancyId)
    .forEach((item) => {
      item.score = scoreCandidate(vacancy(vacancyId), candidate(item.candidateId));
    });
}

function listCandidates(url: URL) {
  const stack = url.searchParams.get("stack") as Stack | null;
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  const minYears = url.searchParams.get("minYears");
  const maxYears = url.searchParams.get("maxYears");
  let items = state.candidates;

  if (stack) {
    items = items.filter((item) => item.stacks.includes(stack));
  }
  if (search) {
    items = items.filter((item) => searchText(item as unknown as Record<string, unknown>).includes(search));
  }
  if (minYears) {
    items = items.filter((item) => item.yearsExperience >= Number(minYears));
  }
  if (maxYears) {
    items = items.filter((item) => item.yearsExperience <= Number(maxYears));
  }

  return list(items as unknown as Record<string, unknown>[], url) as unknown;
}

function listCompanies(url: URL) {
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  const items = search ? state.companies.filter((item) => item.name.toLowerCase().includes(search)) : state.companies;
  return list(items as unknown as Record<string, unknown>[], url) as unknown;
}

function listVacancies(url: URL) {
  const stack = url.searchParams.get("stack") as Stack | null;
  const status = url.searchParams.get("status") as VacancyStatus | null;
  const companyId = url.searchParams.get("companyId");
  const search = url.searchParams.get("search")?.trim().toLowerCase();
  let items = state.vacancies;

  if (stack) {
    items = items.filter((item) => item.stacks.includes(stack));
  }
  if (status) {
    items = items.filter((item) => item.status === status);
  }
  if (companyId) {
    items = items.filter((item) => item.companyId === companyId);
  }
  if (search) {
    items = items.filter((item) => item.title.toLowerCase().includes(search));
  }

  return list(items as unknown as Record<string, unknown>[], url) as unknown;
}

function createApplication(body: Body) {
  const appCandidate = candidate(String(body.candidateId ?? ""));
  const appVacancy = vacancy(String(body.vacancyId ?? ""));
  if (state.applications.some((item) => item.candidateId === appCandidate.id && item.vacancyId === appVacancy.id)) {
    throw new DemoRequestError(409, "Application already exists for candidate and vacancy");
  }
  if (appVacancy.status === "CLOSED") {
    throw new DemoRequestError(409, "Cannot apply to a closed vacancy");
  }

  const createdAt = stamp();
  const item: DemoApplication = {
    id: id("app"),
    candidateId: appCandidate.id,
    vacancyId: appVacancy.id,
    stage: "POSTULADO",
    score: scoreCandidate(appVacancy, appCandidate),
    createdAt,
  };
  state.applications.unshift(item);
  state.stageEvents.unshift(eventForApplication({
    id: id("evt"),
    fromStage: null,
    toStage: "POSTULADO",
    byUserId: demoUserIds.recruiter,
    byUserName: "Maya Recruiter",
    note: "Application received and screened into the pipeline.",
    createdAt,
  }, item.id));

  return summary(item);
}

function listApplications(url: URL) {
  const stage = url.searchParams.get("stage") as Stage | null;
  const vacancyId = url.searchParams.get("vacancyId");
  const candidateId = url.searchParams.get("candidateId");
  const minScore = url.searchParams.get("minScore");
  let items = state.applications;

  if (stage) {
    items = items.filter((item) => item.stage === stage);
  }
  if (vacancyId) {
    items = items.filter((item) => item.vacancyId === vacancyId);
  }
  if (candidateId) {
    items = items.filter((item) => item.candidateId === candidateId);
  }
  if (minScore) {
    items = items.filter((item) => item.score >= Number(minScore));
  }

  return list(items.map(summary) as unknown as Record<string, unknown>[], url) as unknown;
}

function reachedStage(item: DemoApplication, stage: Stage) {
  return item.stage === stage || state.stageEvents.some((event) => applicationEventId(event) === item.id && event.toStage === stage);
}

function dashboardSummary(): DashboardSummary {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  const active = state.applications.filter((item) => activeStages.includes(item.stage));
  const applicationsByStage = Object.fromEntries(stages.map((stage) => [stage, state.applications.filter((item) => item.stage === stage).length]));

  return {
    openVacancies: state.vacancies.filter((item) => item.status === "OPEN").length,
    totalCandidates: state.candidates.length,
    activeApplications: active.length,
    offersThisMonth: eventsThisMonth("OFERTA", monthStart, nextMonth),
    rejectedThisMonth: eventsThisMonth("RECHAZADO", monthStart, nextMonth),
    avgScoreActive: active.length ? active.reduce((sum, item) => sum + item.score, 0) / active.length : 0,
    applicationsByStage,
  };
}

function eventsThisMonth(stage: Stage, start: Date, end: Date) {
  return state.stageEvents.filter((event) => {
    const createdAt = new Date(event.createdAt);
    return event.toStage === stage && createdAt >= start && createdAt < end;
  }).length;
}

function funnel(): DashboardFunnelItem[] {
  let previous = 0;
  return forwardStages.map((stage, index) => {
    const count = stage === "POSTULADO" ? state.applications.length : state.applications.filter((item) => reachedStage(item, stage)).length;
    const conversionPct = index === 0 ? 100 : previous === 0 ? 0 : Math.round((count * 10000) / previous) / 100;
    previous = count;
    return { stage, count, conversionPct };
  });
}

function stackDemand(): DashboardStackDemandItem[] {
  return stacks
    .map((stack) => ({
      stack,
      openVacancies: state.vacancies.filter((item) => item.status === "OPEN" && item.stacks.includes(stack)).length,
      activeApplications: state.applications.filter((item) => activeStages.includes(item.stage) && vacancy(item.vacancyId).stacks.includes(stack)).length,
    }))
    .sort((left, right) => right.activeApplications - left.activeApplications || right.openVacancies - left.openVacancies || left.stack.localeCompare(right.stack));
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function timeline(url: URL): DashboardTimelineItem[] {
  const rawDays = Number(url.searchParams.get("days") ?? 30);
  const days = rawDays < 1 ? 30 : Math.min(rawDays, 365);
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - days + 1);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      applications: state.applications.filter((item) => item.createdAt.slice(0, 10) === key).length,
      offers: state.stageEvents.filter((event) => event.toStage === "OFERTA" && event.createdAt.slice(0, 10) === key).length,
    };
  });
}

export async function demoRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = route(path);
  const method = (options.method ?? "GET").toUpperCase();
  const parts = url.pathname.split("/").filter(Boolean);

  await Promise.resolve();

  if (url.pathname === "/auth/login" && method === "POST") {
    const body = requireBody(options);
    const user = state.users.find((item) => item.email === body.email);
    if (!user || body.password !== "demo1234") {
      throw new DemoRequestError(401, "Invalid demo credentials.");
    }
    return { accessToken: `demo-token-${user.role.toLowerCase()}`, user } as T;
  }

  if (url.pathname === "/candidates" && method === "GET") {
    return listCandidates(url) as T;
  }
  if (url.pathname === "/candidates" && method === "POST") {
    return createCandidate(requireBody(options)) as T;
  }
  if (parts[0] === "candidates" && parts[1] && method === "GET") {
    return candidate(parts[1]) as T;
  }
  if (parts[0] === "candidates" && parts[1] && method === "PATCH") {
    return updateCandidate(parts[1], requireBody(options)) as T;
  }
  if (parts[0] === "candidates" && parts[1] && method === "DELETE") {
    removeEntity("candidates", parts[1]);
    return undefined as T;
  }

  if (url.pathname === "/companies" && method === "GET") {
    return listCompanies(url) as T;
  }
  if (url.pathname === "/companies" && method === "POST") {
    requireAdmin();
    return createCompany(requireBody(options)) as T;
  }
  if (parts[0] === "companies" && parts[1] && method === "GET") {
    return state.companies.find((item) => item.id === parts[1]) as T;
  }
  if (parts[0] === "companies" && parts[1] && method === "PATCH") {
    requireAdmin();
    return updateCompany(parts[1], requireBody(options)) as T;
  }
  if (parts[0] === "companies" && parts[1] && method === "DELETE") {
    requireAdmin();
    removeEntity("companies", parts[1]);
    return undefined as T;
  }

  if (url.pathname === "/vacancies" && method === "GET") {
    return listVacancies(url) as T;
  }
  if (url.pathname === "/vacancies" && method === "POST") {
    requireAdmin();
    return createVacancy(requireBody(options)) as T;
  }
  if (parts[0] === "vacancies" && parts[1] && method === "GET") {
    return vacancy(parts[1]) as T;
  }
  if (parts[0] === "vacancies" && parts[1] && method === "PATCH") {
    requireAdmin();
    return updateVacancy(parts[1], requireBody(options)) as T;
  }
  if (parts[0] === "vacancies" && parts[1] && method === "DELETE") {
    requireAdmin();
    removeEntity("vacancies", parts[1]);
    return undefined as T;
  }

  if (url.pathname === "/applications" && method === "GET") {
    return listApplications(url) as T;
  }
  if (url.pathname === "/applications" && method === "POST") {
    return createApplication(requireBody(options)) as T;
  }
  if (url.pathname === "/applications/board" && method === "GET") {
    return board(url) as T;
  }
  if (parts[0] === "applications" && parts[1] && parts[2] === "stage" && method === "PATCH") {
    return moveStage(parts[1], requireBody(options)) as T;
  }
  if (parts[0] === "applications" && parts[1] && parts[2] === "history" && method === "GET") {
    application(parts[1]);
    return state.stageEvents.filter((event) => applicationEventId(event) === parts[1]).sort((left, right) => right.createdAt.localeCompare(left.createdAt)) as T;
  }
  if (parts[0] === "applications" && parts[1] && parts[2] === "interviews" && method === "POST") {
    return createInterview(parts[1], requireBody(options)) as T;
  }
  if (parts[0] === "applications" && parts[1] && method === "GET") {
    return detail(parts[1]) as T;
  }
  if (parts[0] === "interviews" && parts[1] && method === "PATCH") {
    return updateInterview(parts[1], requireBody(options)) as T;
  }

  if (url.pathname === "/dashboard/summary" && method === "GET") {
    return dashboardSummary() as T;
  }
  if (url.pathname === "/dashboard/funnel" && method === "GET") {
    return funnel() as T;
  }
  if (url.pathname === "/dashboard/stack-demand" && method === "GET") {
    return stackDemand() as T;
  }
  if (url.pathname === "/dashboard/timeline" && method === "GET") {
    return timeline(url) as T;
  }

  throw new DemoRequestError(404, `Demo endpoint not implemented: ${method} ${url.pathname}`);
}
