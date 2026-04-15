# My Tasks — Full-Stack Todo App

A clean, responsive personal task management application built with a modern TypeScript stack. Create, complete, sort, and filter your todos with optional due dates — all backed by a PostgreSQL database and deployable via Docker.

![App Screenshot](app-screenshot.png)

## Features

- **CRUD todos** — Add, complete, and delete tasks instantly
- **Due dates** — Attach optional due dates to any task via an inline date picker
- **Filter views** — Switch between All, Active, and Completed tabs
- **Sorting** — Sort by due date (soonest first) or by status (active first)
- **Undo delete** — Toast notification with undo action after deleting a task
- **Remaining counter** — Live count of active tasks in the header
- **Accessible** — Keyboard navigation, ARIA labels, responsive touch targets, reduced-motion support
- **Skeleton loading** — Graceful loading states with animated placeholders
- **Error banner** — Inline error display with retry capability

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 8, Tailwind CSS 4, TanStack Query 5 |
| **Backend** | Fastify 5, Zod 4, Drizzle ORM |
| **Database** | PostgreSQL 16 |
| **Language** | TypeScript (strict) throughout |
| **Monorepo** | pnpm workspaces |
| **Infra** | Docker Compose, nginx reverse proxy |
| **Quality** | Biome (lint + format), Vitest, Playwright, pre-commit hooks |

## Project Structure

```
bmad-todo-app/
├── packages/
│   ├── backend/          # Fastify REST API + Drizzle ORM
│   │   ├── src/
│   │   │   ├── routes/   # /api/todos CRUD endpoints
│   │   │   ├── schema/   # Drizzle schema + migrations
│   │   │   ├── plugins/  # DB connection plugin
│   │   │   ├── config/   # Zod-validated environment
│   │   │   └── scripts/  # Seed scripts
│   │   └── Dockerfile
│   └── frontend/         # React SPA
│       ├── src/
│       │   ├── components/  # Todo cards, filters, sort, input
│       │   ├── hooks/       # useTodos (TanStack Query)
│       │   └── lib/         # API client
│       ├── nginx.conf
│       └── Dockerfile
├── e2e/                  # Playwright end-to-end tests
├── secrets/              # Docker secret files (gitignored)
├── docker-compose.yml
└── biome.json
```

## Prerequisites

- **Node.js** 22+
- **pnpm** 10+ (`corepack enable` to use the pinned version)
- **Docker** & **Docker Compose** (for the database, or for full-stack deployment)

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment

Copy the example and adjust if needed:

```bash
cp .env.example packages/backend/.env
```

Default values work out of the box for local development with the Docker-managed database.

The backend reads `packages/backend/.env`. In normal local development, keep both connection strings in that file:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bmad_todo
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5433/bmad_todo_test
PORT=3000
NODE_ENV=development
```

Use them like this:

- `DATABASE_URL` is the app's main database connection. `pnpm dev` expects this to point at the `dev` profile database on port `5432`.
- `DATABASE_URL_TEST` is only for automated tests and backend integration test helpers. `pnpm test` and `pnpm --filter backend test` use the isolated test database on port `5433`.

If you change `DATABASE_URL` to the test database on port `5433`, the app will run against test data instead of your normal dev data.

### Switching between dev and test

You usually do not need to edit `.env` when switching environments. Keep both URLs in place and switch by starting the matching Docker profile or script:

```bash
# Normal development
pnpm dev

# Start only the isolated test database
pnpm compose:test:up

# Run tests against the isolated test database
pnpm test
```

Use these rules of thumb:

- Working on the app locally: run `pnpm dev`. This starts the `dev` Docker profile and uses `DATABASE_URL`.
- Running backend or integration tests: run `pnpm compose:test:up` once, then `pnpm test` or `pnpm --filter backend test`. These use `DATABASE_URL_TEST`.
- Running the full production-like Docker stack: use `docker compose up --build`. This does not use the local `DATABASE_URL=localhost:...` value inside the backend container.

### 3. Start developing

```bash
pnpm dev
```

This single command:
1. Starts PostgreSQL via Docker Compose (with the `dev` profile, exposing port 5432 via a socat sidecar)
2. Launches the backend API on `http://localhost:3000` (with auto-reload)
3. Launches the frontend on `http://localhost:5173` (with HMR)

The Vite dev server proxies `/api` requests to the backend automatically.

### 4. Seed demo data (optional)

```bash
pnpm db:seed:demo
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm compose -- <docker compose args>` | Run Docker Compose from the repo root |
| `pnpm compose:up` | Start the default production-like Compose stack |
| `pnpm compose:down` | Stop the default Compose stack |
| `pnpm compose:dev:up` | Start the dev profile database + port-forward sidecar |
| `pnpm compose:dev:down` | Stop Compose services started with the dev profile |
| `pnpm compose:test:up` | Start the isolated test database profile |
| `pnpm compose:test:down` | Stop Compose services started with the test profile |
| `pnpm dev` | Start DB + dev profile sidecar + all dev servers |
| `pnpm dev:app` | Start dev servers only (DB already running) |
| `pnpm dev:down` | Stop Docker containers (including dev profile) |
| `pnpm build` | Build all packages for production |
| `pnpm lint` | Run Biome linter and formatter checks |
| `pnpm lint:fix` | Auto-fix lint and format issues |
| `pnpm test` | Run unit/integration tests across all packages |
| `pnpm test:e2e` | Run Playwright end-to-end tests |
| `pnpm db:seed:demo` | Seed the database with sample todos |

## Docker Compose Profiles

The project uses Docker Compose profiles to isolate development, testing, and production concerns.

You can also run Compose through the root scripts, for example `pnpm compose:up`, `pnpm compose:dev:up`, or `pnpm compose -- ps`.

| Profile | Command | What it starts |
|---------|---------|----------------|
| _(none)_ | `docker compose up --build` | Production stack: `db`, `backend`, `frontend` |
| `dev` | `docker compose --profile dev up -d db dev-db-access` | DB + socat sidecar exposing port 5432 to the host |
| `test` | `docker compose --profile test up -d test-db` | Isolated test DB on port 5433 (`bmad_todo_test`) |

- **Production** — `docker compose up` starts only the default services. The database has no host-exposed port; the backend connects over the internal Docker network.
- **Dev** — The `dev-db-access` sidecar (alpine/socat) forwards host port 5432 to the internal `db` service so local tooling and the backend dev server can connect. `pnpm dev` activates this profile automatically.
- **Test** — A separate `test-db` service runs `postgres:16-alpine` with simple credentials (`postgres`/`postgres`), database `bmad_todo_test`, an isolated `pgdata_test` volume, and host port 5433. Keep this mapped to `DATABASE_URL_TEST`, not your normal `DATABASE_URL`.

## Docker Deployment

For a full containerized stack (frontend + backend + database):

### 1. Create Docker secrets

```bash
mkdir -p secrets
printf '%s' 'postgres' > secrets/postgres_user.txt
printf '%s' 'change-me' > secrets/postgres_password.txt
```

### 2. Configure environment

Set these in `.env` or your shell environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_DB` | `bmad_todo` | Database name |
| `FRONTEND_PORT` | `8080` | Host port for the frontend |
| `ALLOWED_ORIGINS` | — | Comma-separated browser origins (required in production) |
| `DATABASE_URL_TEST` | — | Connection string for the test profile DB (optional) |

### 3. Launch

```bash
docker compose up --build
```

The app is served at `http://localhost:8080` with nginx handling static assets and reverse-proxying `/api` to the backend. The backend runs migrations automatically on startup.

## API

The backend exposes a REST API with auto-generated Swagger documentation at `/documentation` when running in development mode.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/todos` | List all todos |
| `POST` | `/api/todos` | Create a new todo |
| `PATCH` | `/api/todos/:id` | Update completion status or due date |
| `DELETE` | `/api/todos/:id` | Delete a todo |

## Testing

**Unit & integration tests** run with Vitest across both packages (backend integration tests use the isolated test database on port 5433 by default):

```bash
pnpm test
```

**End-to-end tests** run with Playwright against the full running stack:

```bash
pnpm test:e2e
```

**Test database** — To spin up an isolated test database for integration tests without touching dev data:

```bash
docker compose --profile test up -d test-db
pnpm --filter backend test
# Connect: psql -h localhost -p 5433 -U postgres -d bmad_todo_test
```

Recommended `packages/backend/.env` layout for local work:

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bmad_todo
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5433/bmad_todo_test
PORT=3000
NODE_ENV=development
```

That lets you switch contexts with commands instead of rewriting env values.

The test suite covers CRUD operations, filtering, sorting, due dates, error states, accessibility, and responsive behavior.

## License

Private project — not published to any registry.
