create extension if not exists pgcrypto;

create table users (
    id uuid primary key,
    name varchar(160) not null,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    role varchar(20) not null check (role in ('RECRUITER', 'ADMIN')),
    created_at timestamptz not null default now()
);

create table companies (
    id uuid primary key,
    name varchar(180) not null,
    industry varchar(120) not null,
    created_at timestamptz not null default now()
);

create table vacancies (
    id uuid primary key,
    company_id uuid not null references companies(id),
    title varchar(180) not null,
    seniority_years int not null,
    status varchar(20) not null check (status in ('OPEN', 'CLOSED')),
    created_at timestamptz not null default now()
);

create table vacancy_stacks (
    vacancy_id uuid not null references vacancies(id) on delete cascade,
    stack varchar(20) not null check (stack in ('REACT', 'JAVA', 'SQL', 'PYTHON', 'DOTNET')),
    primary key (vacancy_id, stack)
);

create table candidates (
    id uuid primary key,
    name varchar(160) not null,
    email varchar(255) not null unique,
    headline varchar(220) not null,
    years_experience int not null,
    extra_skills text,
    created_at timestamptz not null default now()
);

create table candidate_stacks (
    candidate_id uuid not null references candidates(id) on delete cascade,
    stack varchar(20) not null check (stack in ('REACT', 'JAVA', 'SQL', 'PYTHON', 'DOTNET')),
    primary key (candidate_id, stack)
);

create table applications (
    id uuid primary key,
    candidate_id uuid not null references candidates(id),
    vacancy_id uuid not null references vacancies(id),
    stage varchar(30) not null default 'POSTULADO' check (stage in ('POSTULADO', 'ENTREVISTA', 'PRUEBA_TECNICA', 'OFERTA', 'RECHAZADO')),
    score int not null,
    created_at timestamptz not null default now(),
    unique (candidate_id, vacancy_id)
);

create table stage_events (
    id uuid primary key,
    application_id uuid not null references applications(id) on delete cascade,
    from_stage varchar(30) check (from_stage in ('POSTULADO', 'ENTREVISTA', 'PRUEBA_TECNICA', 'OFERTA', 'RECHAZADO')),
    to_stage varchar(30) not null check (to_stage in ('POSTULADO', 'ENTREVISTA', 'PRUEBA_TECNICA', 'OFERTA', 'RECHAZADO')),
    by_user_id uuid not null references users(id),
    note text,
    created_at timestamptz not null default now()
);

create table interviews (
    id uuid primary key,
    application_id uuid not null references applications(id) on delete cascade,
    scheduled_at timestamptz not null,
    kind varchar(20) not null check (kind in ('PHONE', 'TECHNICAL', 'CULTURAL', 'FINAL')),
    notes text,
    rating int check (rating is null or rating between 1 and 5),
    by_user_id uuid not null references users(id),
    created_at timestamptz not null default now()
);

create index idx_vacancies_company_id on vacancies(company_id);
create index idx_applications_candidate_id on applications(candidate_id);
create index idx_applications_vacancy_id on applications(vacancy_id);
create index idx_stage_events_application_id on stage_events(application_id);
create index idx_stage_events_by_user_id on stage_events(by_user_id);
create index idx_interviews_application_id on interviews(application_id);
create index idx_interviews_by_user_id on interviews(by_user_id);
