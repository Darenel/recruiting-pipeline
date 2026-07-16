# Recruiting Pipeline

Recruiting Pipeline is a small ATS for teams that need a practical Kanban view of open roles, candidates, interviews, and hiring outcomes. It combines a dark "Ambar Nocturno" web UI with a Spring Boot API, seeded demo data, automatic candidate scoring, and dashboard charts.

## Stack

- Spring Boot 3.3, Java 21, Spring Security, JPA, Flyway, PostgreSQL
- React 19, Vite, TanStack Query, Recharts, React Router
- Docker Compose for PostgreSQL, API, and the static web image

## Features

- Candidate, company, vacancy, and application catalogs
- Kanban pipeline across postulado, entrevista, prueba tecnica, oferta, and rechazado
- Drag-and-drop stage movement with guarded transitions
- Interview notes and ratings on active interview stages
- Dashboard metrics for stage distribution, funnel conversion, stack demand, and application timeline
- Swagger UI at `/docs`

## Quickstart With Docker

Create a `.env` file from `.env.example`, then run:

```bash
docker compose up --build
```

The web app is served at `http://localhost:8081`, the API at `http://localhost:8080`, and Swagger at `http://localhost:8080/docs`.

## Local Development

Start PostgreSQL with Compose:

```bash
docker compose up postgres
```

Run the API:

```bash
cd api
./mvnw spring-boot:run
```

Run the web app:

```bash
cd web
npm install
npm run dev
```

Vite proxies `/api` to `http://localhost:8080`.

## Demo Credentials

- `admin@recruiting.local`
- `recruiter@recruiting.local`
- Password for both: `demo1234`

## Scoring

Candidate scores are rounded to 0-100 from a weighted formula: 60% required stack overlap, 25% experience fit against vacancy seniority, and 15% bonus skill overlap. In the current backend the bonus overlap uses the same required-stack overlap, so strong stack alignment carries most of the score while experience can still separate close matches.

## Static Demo Build

The web app also has a static demo mode:

```bash
cd web
npm run build:demo
```

That build uses `/projects/recruiting/` as its base path and serves all API calls from in-memory demo data. Mutations are local to the browser session and reset on reload.

## License

MIT. See [LICENSE](LICENSE).
