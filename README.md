# Recruiting Pipeline

Recruiting Pipeline is a full-stack application tracking system for companies, vacancies, candidates, and hiring stages. This first phase sets up the API, web app, and local Postgres foundation for the product.

## Stack

- Spring Boot 3.3, Java 21, Maven
- PostgreSQL 16 with Flyway migrations
- React 19, TypeScript, Vite
- TanStack Query and React Router

## Quickstart

Copy `.env.example` to `.env`, then start Postgres:

```sh
docker compose up -d postgres
```

Run the API from `api/` with JDK 21:

```sh
./mvnw spring-boot:run
```

Run the web app from `web/`:

```sh
npm install
npm run dev
```

The health endpoint is available at `GET /api/v1/health`.

## Layout

- `api/` contains the Spring Boot REST API.
- `web/` contains the Vite React application.
- `docker-compose.yml` runs the local PostgreSQL service.
