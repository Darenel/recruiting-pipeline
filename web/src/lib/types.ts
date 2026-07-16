export type UUID = string;

export type UserRole = "RECRUITER" | "ADMIN";
export type Stack = "REACT" | "JAVA" | "SQL" | "PYTHON" | "DOTNET";
export type Stage = "POSTULADO" | "ENTREVISTA" | "PRUEBA_TECNICA" | "OFERTA" | "RECHAZADO";
export type VacancyStatus = "OPEN" | "CLOSED";
export type InterviewKind = "PHONE" | "TECHNICAL" | "CULTURAL" | "FINAL";

export type Candidate = {
  id: UUID;
  name: string;
  email: string;
  headline: string;
  yearsExperience: number;
  extraSkills: string | null;
  stacks: Stack[];
  createdAt: string;
};

export type CandidateRequest = {
  name: string;
  email: string;
  headline: string;
  yearsExperience: number;
  extraSkills: string;
  stacks: Stack[];
};

export type Company = {
  id: UUID;
  name: string;
  industry: string;
  createdAt: string;
};

export type CompanyRequest = {
  name: string;
  industry: string;
};

export type Vacancy = {
  id: UUID;
  companyId: UUID;
  companyName: string;
  title: string;
  seniorityYears: number;
  status: VacancyStatus;
  stacks: Stack[];
  createdAt: string;
};

export type VacancyRequest = {
  companyId: UUID;
  title: string;
  seniorityYears: number;
  status: VacancyStatus;
  stacks: Stack[];
};

export type BoardApplication = {
  id: UUID;
  candidateName: string;
  headline: string;
  score: number;
  daysInStage: number;
  interviewCount: number;
};

export type BoardColumn = {
  stage: Stage;
  applications: BoardApplication[];
};

export type Board = {
  columns: BoardColumn[];
};

export type ApplicationSummary = {
  id: UUID;
  stage: Stage;
  score: number;
  candidate: Pick<Candidate, "id" | "name" | "headline" | "stacks" | "yearsExperience">;
  vacancy: Pick<Vacancy, "id" | "title" | "companyName" | "stacks" | "seniorityYears" | "status">;
  createdAt: string;
};

export type StageEvent = {
  id: UUID;
  fromStage: Stage | null;
  toStage: Stage;
  byUserId: UUID;
  byUserName: string;
  note: string | null;
  createdAt: string;
};

export type Interview = {
  id: UUID;
  applicationId: UUID;
  scheduledAt: string;
  kind: InterviewKind;
  notes: string | null;
  rating: number | null;
  byUserId: UUID;
  byUserName: string;
  createdAt: string;
};

export type ApplicationDetail = ApplicationSummary & {
  history: StageEvent[];
  interviews: Interview[];
};

export const stacks: Stack[] = ["REACT", "JAVA", "SQL", "PYTHON", "DOTNET"];
export const stages: Stage[] = ["POSTULADO", "ENTREVISTA", "PRUEBA_TECNICA", "OFERTA", "RECHAZADO"];
export const interviewKinds: InterviewKind[] = ["PHONE", "TECHNICAL", "CULTURAL", "FINAL"];
