import { AuthUser } from "../auth/storage";
import {
  Candidate,
  Company,
  Interview,
  Stack,
  Stage,
  StageEvent,
  Vacancy,
} from "../lib/types";

export type DemoApplication = {
  id: string;
  candidateId: string;
  vacancyId: string;
  stage: Stage;
  score: number;
  createdAt: string;
};

export type DemoState = {
  users: AuthUser[];
  companies: Company[];
  vacancies: Vacancy[];
  candidates: Candidate[];
  applications: DemoApplication[];
  stageEvents: StageEvent[];
  interviews: Interview[];
};

const now = new Date();

function iso(daysAgo: number, hour = 10) {
  const date = new Date(now);
  date.setDate(now.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

export const demoUsers: AuthUser[] = [
  { id: 1, name: "Daren Admin", email: "admin@recruiting.local", role: "ADMIN" },
  { id: 2, name: "Maya Recruiter", email: "recruiter@recruiting.local", role: "RECRUITER" },
];

export const demoUserIds = {
  admin: "00000000-0000-0000-0000-000000000001",
  recruiter: "00000000-0000-0000-0000-000000000002",
};

const companies: Company[] = [
  { id: "10000000-0000-0000-0000-000000000001", name: "Northstar Fintech", industry: "Payments", createdAt: iso(58) },
  { id: "10000000-0000-0000-0000-000000000002", name: "Aster Cloud Health", industry: "Healthtech", createdAt: iso(57) },
  { id: "10000000-0000-0000-0000-000000000003", name: "Copperleaf Commerce", industry: "Retail SaaS", createdAt: iso(56) },
  { id: "10000000-0000-0000-0000-000000000004", name: "Brightline Data", industry: "Analytics", createdAt: iso(55) },
  { id: "10000000-0000-0000-0000-000000000005", name: "OrbitOps", industry: "Developer Tools", createdAt: iso(54) },
  { id: "10000000-0000-0000-0000-000000000006", name: "Verde Logistics", industry: "Supply Chain", createdAt: iso(53) },
];

const vacancySeed: Array<Omit<Vacancy, "companyName" | "createdAt"> & { daysAgo: number }> = [
  { id: "20000000-0000-0000-0000-000000000001", companyId: companies[0].id, title: "Senior Java Backend Engineer", seniorityYears: 5, status: "OPEN", stacks: ["JAVA", "SQL"], daysAgo: 52 },
  { id: "20000000-0000-0000-0000-000000000002", companyId: companies[0].id, title: "React Frontend Engineer", seniorityYears: 3, status: "OPEN", stacks: ["REACT", "SQL"], daysAgo: 51 },
  { id: "20000000-0000-0000-0000-000000000003", companyId: companies[1].id, title: "Full Stack Health Platform Engineer", seniorityYears: 4, status: "OPEN", stacks: ["REACT", "JAVA", "SQL"], daysAgo: 50 },
  { id: "20000000-0000-0000-0000-000000000004", companyId: companies[2].id, title: "SQL Data Applications Engineer", seniorityYears: 4, status: "OPEN", stacks: ["SQL", "DOTNET"], daysAgo: 49 },
  { id: "20000000-0000-0000-0000-000000000005", companyId: companies[3].id, title: "Python Analytics Engineer", seniorityYears: 3, status: "OPEN", stacks: ["PYTHON", "SQL"], daysAgo: 48 },
  { id: "20000000-0000-0000-0000-000000000006", companyId: companies[4].id, title: ".NET Platform Engineer", seniorityYears: 5, status: "OPEN", stacks: ["DOTNET", "SQL"], daysAgo: 47 },
  { id: "20000000-0000-0000-0000-000000000007", companyId: companies[5].id, title: "Integration Engineer Java SQL", seniorityYears: 4, status: "OPEN", stacks: ["JAVA", "SQL"], daysAgo: 46 },
  { id: "20000000-0000-0000-0000-000000000008", companyId: companies[1].id, title: "Junior React Developer", seniorityYears: 1, status: "OPEN", stacks: ["REACT"], daysAgo: 45 },
  { id: "20000000-0000-0000-0000-000000000009", companyId: companies[3].id, title: "Lead Data Platform Engineer", seniorityYears: 6, status: "CLOSED", stacks: ["PYTHON", "SQL", "JAVA"], daysAgo: 44 },
  { id: "20000000-0000-0000-0000-000000000010", companyId: companies[4].id, title: "Backend Tools Engineer", seniorityYears: 4, status: "OPEN", stacks: ["JAVA", "PYTHON"], daysAgo: 43 },
];

const vacancies: Vacancy[] = vacancySeed.map((vacancy) => ({
  ...vacancy,
  companyName: companies.find((company) => company.id === vacancy.companyId)?.name ?? "",
  createdAt: iso(vacancy.daysAgo),
}));

const candidateSeed: Array<Omit<Candidate, "createdAt"> & { daysAgo: number }> = [
  { id: "30000000-0000-0000-0000-000000000001", name: "Sofia Ramirez", email: "sofia.ramirez@example.com", headline: "Backend engineer focused on payment APIs", yearsExperience: 6, extraSkills: "Spring Boot, Kafka, observability", stacks: ["JAVA", "SQL"], daysAgo: 42 },
  { id: "30000000-0000-0000-0000-000000000002", name: "Mateo Cruz", email: "mateo.cruz@example.com", headline: "Frontend engineer building product dashboards", yearsExperience: 4, extraSkills: "TypeScript, accessibility, design systems", stacks: ["REACT", "SQL"], daysAgo: 41 },
  { id: "30000000-0000-0000-0000-000000000003", name: "Camila Ortega", email: "camila.ortega@example.com", headline: "Full stack engineer for healthcare workflows", yearsExperience: 5, extraSkills: "FHIR, React Query, PostgreSQL", stacks: ["REACT", "JAVA", "SQL"], daysAgo: 40 },
  { id: "30000000-0000-0000-0000-000000000004", name: "Lucas Bennett", email: "lucas.bennett@example.com", headline: "Data applications engineer", yearsExperience: 4, extraSkills: "ETL, reporting, warehouse modeling", stacks: ["SQL", "DOTNET"], daysAgo: 39 },
  { id: "30000000-0000-0000-0000-000000000005", name: "Valentina Morales", email: "valentina.morales@example.com", headline: "Analytics engineer with Python and SQL depth", yearsExperience: 3, extraSkills: "dbt, Airflow, product metrics", stacks: ["PYTHON", "SQL"], daysAgo: 38 },
  { id: "30000000-0000-0000-0000-000000000006", name: "Nicolas Herrera", email: "nicolas.herrera@example.com", headline: ".NET engineer modernizing enterprise services", yearsExperience: 7, extraSkills: "Azure, messaging, distributed systems", stacks: ["DOTNET", "SQL"], daysAgo: 37 },
  { id: "30000000-0000-0000-0000-000000000007", name: "Emma Wilson", email: "emma.wilson@example.com", headline: "Backend integration engineer", yearsExperience: 4, extraSkills: "REST APIs, partner integrations, testing", stacks: ["JAVA", "SQL"], daysAgo: 36 },
  { id: "30000000-0000-0000-0000-000000000008", name: "Diego Alvarez", email: "diego.alvarez@example.com", headline: "Junior frontend developer", yearsExperience: 1, extraSkills: "CSS, component libraries, QA support", stacks: ["REACT"], daysAgo: 35 },
  { id: "30000000-0000-0000-0000-000000000009", name: "Priya Shah", email: "priya.shah@example.com", headline: "Lead data platform engineer", yearsExperience: 8, extraSkills: "Spark, governance, platform reliability", stacks: ["PYTHON", "SQL", "JAVA"], daysAgo: 34 },
  { id: "30000000-0000-0000-0000-000000000010", name: "Owen Carter", email: "owen.carter@example.com", headline: "Developer tools backend engineer", yearsExperience: 5, extraSkills: "CLI tooling, internal platforms, APIs", stacks: ["JAVA", "PYTHON"], daysAgo: 33 },
  { id: "30000000-0000-0000-0000-000000000011", name: "Isabella Torres", email: "isabella.torres@example.com", headline: "React engineer with SQL reporting background", yearsExperience: 3, extraSkills: "Storybook, dashboards, customer analytics", stacks: ["REACT", "SQL"], daysAgo: 32 },
  { id: "30000000-0000-0000-0000-000000000012", name: "Andre Silva", email: "andre.silva@example.com", headline: "Java engineer moving into data products", yearsExperience: 2, extraSkills: "Batch jobs, PostgreSQL, clean architecture", stacks: ["JAVA", "SQL"], daysAgo: 31 },
  { id: "30000000-0000-0000-0000-000000000013", name: "Hannah Kim", email: "hannah.kim@example.com", headline: "Python engineer for operational analytics", yearsExperience: 4, extraSkills: "Pandas, FastAPI, experimentation", stacks: ["PYTHON", "SQL"], daysAgo: 30 },
  { id: "30000000-0000-0000-0000-000000000014", name: "Martin Keller", email: "martin.keller@example.com", headline: ".NET and SQL engineer for logistics systems", yearsExperience: 5, extraSkills: "T-SQL, integrations, domain modeling", stacks: ["DOTNET", "SQL"], daysAgo: 29 },
  { id: "30000000-0000-0000-0000-000000000015", name: "Sara Thompson", email: "sara.thompson@example.com", headline: "Product-minded full stack developer", yearsExperience: 2, extraSkills: "UX collaboration, forms, support tooling", stacks: ["REACT", "JAVA"], daysAgo: 28 },
  { id: "30000000-0000-0000-0000-000000000016", name: "Javier Luna", email: "javier.luna@example.com", headline: "Senior Java engineer with frontend range", yearsExperience: 7, extraSkills: "Spring Security, mentoring, incident response", stacks: ["JAVA", "REACT", "SQL"], daysAgo: 27 },
  { id: "30000000-0000-0000-0000-000000000017", name: "Mei Chen", email: "mei.chen@example.com", headline: "SQL specialist learning Python automation", yearsExperience: 2, extraSkills: "stored procedures, BI, scripting", stacks: ["SQL", "PYTHON"], daysAgo: 26 },
  { id: "30000000-0000-0000-0000-000000000018", name: "Noah Brooks", email: "noah.brooks@example.com", headline: "React developer for SaaS workflows", yearsExperience: 5, extraSkills: "TanStack Query, testing-library, design tokens", stacks: ["REACT", "SQL"], daysAgo: 25 },
  { id: "30000000-0000-0000-0000-000000000019", name: "Elena Petrova", email: "elena.petrova@example.com", headline: "Backend engineer across Java and .NET stacks", yearsExperience: 6, extraSkills: "microservices, PostgreSQL, team leadership", stacks: ["JAVA", "DOTNET", "SQL"], daysAgo: 24 },
  { id: "30000000-0000-0000-0000-000000000020", name: "Rafael Costa", email: "rafael.costa@example.com", headline: "Python developer building data pipelines", yearsExperience: 1, extraSkills: "Airflow basics, SQL tuning, dashboards", stacks: ["PYTHON", "SQL"], daysAgo: 23 },
];

const candidates: Candidate[] = candidateSeed.map((candidate) => ({
  ...candidate,
  createdAt: iso(candidate.daysAgo),
}));

function overlap(required: Stack[], candidate: Stack[]) {
  if (!required.length || !candidate.length) {
    return 0;
  }
  return required.filter((stack) => candidate.includes(stack)).length / required.length;
}

function score(vacancy: Vacancy, candidate: Candidate) {
  const stackMatch = overlap(vacancy.stacks, candidate.stacks);
  const experienceMatch = vacancy.seniorityYears <= 0 ? 1 : Math.min(1, Math.max(0, candidate.yearsExperience) / vacancy.seniorityYears);
  const bonusOverlap = stackMatch;
  return Math.round(100 * (0.6 * stackMatch + 0.25 * experienceMatch + 0.15 * bonusOverlap));
}

const applicationPlans: Array<{ candidateIndex: number; vacancyIndex: number; stage: Stage; daysAgo: number }> = [
  { candidateIndex: 0, vacancyIndex: 0, stage: "OFERTA", daysAgo: 40 },
  { candidateIndex: 1, vacancyIndex: 1, stage: "PRUEBA_TECNICA", daysAgo: 39 },
  { candidateIndex: 2, vacancyIndex: 2, stage: "ENTREVISTA", daysAgo: 38 },
  { candidateIndex: 3, vacancyIndex: 3, stage: "RECHAZADO", daysAgo: 37 },
  { candidateIndex: 4, vacancyIndex: 4, stage: "OFERTA", daysAgo: 36 },
  { candidateIndex: 5, vacancyIndex: 5, stage: "ENTREVISTA", daysAgo: 35 },
  { candidateIndex: 6, vacancyIndex: 6, stage: "PRUEBA_TECNICA", daysAgo: 34 },
  { candidateIndex: 7, vacancyIndex: 7, stage: "POSTULADO", daysAgo: 33 },
  { candidateIndex: 8, vacancyIndex: 8, stage: "OFERTA", daysAgo: 32 },
  { candidateIndex: 9, vacancyIndex: 9, stage: "ENTREVISTA", daysAgo: 31 },
  { candidateIndex: 10, vacancyIndex: 2, stage: "POSTULADO", daysAgo: 30 },
  { candidateIndex: 11, vacancyIndex: 0, stage: "RECHAZADO", daysAgo: 29 },
  { candidateIndex: 12, vacancyIndex: 4, stage: "PRUEBA_TECNICA", daysAgo: 28 },
  { candidateIndex: 13, vacancyIndex: 5, stage: "POSTULADO", daysAgo: 27 },
  { candidateIndex: 14, vacancyIndex: 1, stage: "ENTREVISTA", daysAgo: 26 },
  { candidateIndex: 15, vacancyIndex: 2, stage: "PRUEBA_TECNICA", daysAgo: 25 },
  { candidateIndex: 16, vacancyIndex: 3, stage: "POSTULADO", daysAgo: 24 },
  { candidateIndex: 17, vacancyIndex: 7, stage: "ENTREVISTA", daysAgo: 23 },
  { candidateIndex: 18, vacancyIndex: 5, stage: "POSTULADO", daysAgo: 22 },
  { candidateIndex: 19, vacancyIndex: 4, stage: "POSTULADO", daysAgo: 21 },
  { candidateIndex: 0, vacancyIndex: 9, stage: "POSTULADO", daysAgo: 20 },
  { candidateIndex: 1, vacancyIndex: 7, stage: "RECHAZADO", daysAgo: 19 },
  { candidateIndex: 2, vacancyIndex: 0, stage: "ENTREVISTA", daysAgo: 18 },
  { candidateIndex: 3, vacancyIndex: 6, stage: "POSTULADO", daysAgo: 17 },
  { candidateIndex: 4, vacancyIndex: 8, stage: "PRUEBA_TECNICA", daysAgo: 16 },
  { candidateIndex: 5, vacancyIndex: 3, stage: "ENTREVISTA", daysAgo: 15 },
  { candidateIndex: 6, vacancyIndex: 9, stage: "POSTULADO", daysAgo: 14 },
  { candidateIndex: 7, vacancyIndex: 1, stage: "POSTULADO", daysAgo: 13 },
  { candidateIndex: 8, vacancyIndex: 4, stage: "ENTREVISTA", daysAgo: 12 },
  { candidateIndex: 9, vacancyIndex: 0, stage: "RECHAZADO", daysAgo: 11 },
];

const applications: DemoApplication[] = applicationPlans.map((plan, index) => {
  const candidate = candidates[plan.candidateIndex];
  const vacancy = vacancies[plan.vacancyIndex];
  return {
    id: `40000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
    candidateId: candidate.id,
    vacancyId: vacancy.id,
    stage: plan.stage,
    score: score(vacancy, candidate),
    createdAt: iso(plan.daysAgo),
  };
});

const stagePath: Record<Stage, Stage[]> = {
  POSTULADO: ["POSTULADO"],
  ENTREVISTA: ["POSTULADO", "ENTREVISTA"],
  PRUEBA_TECNICA: ["POSTULADO", "ENTREVISTA", "PRUEBA_TECNICA"],
  OFERTA: ["POSTULADO", "ENTREVISTA", "PRUEBA_TECNICA", "OFERTA"],
  RECHAZADO: ["POSTULADO", "ENTREVISTA", "RECHAZADO"],
};

const stageNotes: Partial<Record<Stage, string>> = {
  POSTULADO: "Application received and screened into the pipeline.",
  ENTREVISTA: "Relevant background; moved to recruiter screen.",
  PRUEBA_TECNICA: "Advanced to a technical exercise.",
  OFERTA: "Exercise and interviews met expectations.",
  RECHAZADO: "Not moving forward for this opening.",
};

const stageEvents: StageEvent[] = applications.flatMap((application, applicationIndex) => {
  const plan = applicationPlans[applicationIndex];
  const path = stagePath[application.stage];
  return path.map((toStage, eventIndex) => ({
    id: `50000000-0000-0000-${String(applicationIndex + 1).padStart(4, "0")}-${String(eventIndex + 1).padStart(12, "0")}`,
    fromStage: eventIndex === 0 ? null : path[eventIndex - 1],
    toStage,
    byUserId: eventIndex >= 2 || toStage === "OFERTA" ? demoUserIds.admin : demoUserIds.recruiter,
    byUserName: eventIndex >= 2 || toStage === "OFERTA" ? "Daren Admin" : "Maya Recruiter",
    note: stageNotes[toStage] ?? null,
    createdAt: iso(Math.max(plan.daysAgo - eventIndex * 2, 0), 9 + eventIndex),
  }));
});

const interviewPlans = [
  { app: 0, kind: "PHONE", rating: 5, notes: "Clear motivation for fintech and strong ownership examples." },
  { app: 0, kind: "TECHNICAL", rating: 5, notes: "Designed idempotent payment retries with good tradeoffs." },
  { app: 1, kind: "PHONE", rating: 4, notes: "Strong product mindset and accessibility awareness." },
  { app: 2, kind: "PHONE", rating: 4, notes: "Understands healthcare workflow constraints." },
  { app: 5, kind: "PHONE", rating: 4, notes: "Good Azure and service modernization examples." },
  { app: 6, kind: "TECHNICAL", rating: 4, notes: "Integration design was structured and pragmatic." },
  { app: 8, kind: "FINAL", rating: 5, notes: "Strong platform leadership; ready for offer conversation." },
  { app: 12, kind: "TECHNICAL", rating: 4, notes: "Solid data wrangling and testing instincts." },
  { app: 15, kind: "TECHNICAL", rating: 5, notes: "Balanced backend and frontend decisions well." },
  { app: 17, kind: "PHONE", rating: 4, notes: "Strong SaaS UI background." },
  { app: 25, kind: "PHONE", rating: 4, notes: "Good fit for SQL-heavy applications." },
  { app: 28, kind: "PHONE", rating: 4, notes: "Excellent seniority, wants more platform scope." },
] as const;

const interviews: Interview[] = interviewPlans.map((plan, index) => {
  const application = applications[plan.app];
  const scheduledAt = iso(Math.max(applicationPlans[plan.app].daysAgo - 2, 0), 11);
  return {
    id: `60000000-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
    applicationId: application.id,
    scheduledAt,
    kind: plan.kind,
    notes: plan.notes,
    rating: plan.rating,
    byUserId: plan.kind === "TECHNICAL" || plan.kind === "FINAL" ? demoUserIds.admin : demoUserIds.recruiter,
    byUserName: plan.kind === "TECHNICAL" || plan.kind === "FINAL" ? "Daren Admin" : "Maya Recruiter",
    createdAt: scheduledAt,
  };
});

export function createDemoState(): DemoState {
  return {
    users: demoUsers.map((user) => ({ ...user })),
    companies: companies.map((company) => ({ ...company })),
    vacancies: vacancies.map((vacancy) => ({ ...vacancy, stacks: [...vacancy.stacks] })),
    candidates: candidates.map((candidate) => ({ ...candidate, stacks: [...candidate.stacks] })),
    applications: applications.map((application) => ({ ...application })),
    stageEvents: stageEvents.map((event) => ({ ...event })),
    interviews: interviews.map((interview) => ({ ...interview })),
  };
}

export function scoreCandidate(vacancy: Vacancy, candidate: Candidate) {
  return score(vacancy, candidate);
}
