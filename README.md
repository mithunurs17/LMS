# Learning Management System

Phase 1 establishes the repository and runtime foundation for the LMS. The web application, versioned Express API, shared contracts package, and worker placeholder are separate npm workspaces. Product workflows and external media, payment, and live-session integrations are not implemented in this phase.

## Requirements

- Node.js 22 or newer and npm
- Docker Compose for the local MongoDB and Redis option, or reachable external development instances

## Local setup

```sh
npm ci
cp .env.example .env
docker compose up -d mongodb redis
npm run dev
```

The API reads `.env` from the repository root. Update `MONGODB_URI` and `REDIS_URL` if using external services. The API listens on port 3000 and the Vite client on port 5173. The client only starts after the API process starts; API startup validates configuration and requires both dependencies to connect.

Useful commands:

| Command                | Purpose                                                                       |
| ---------------------- | ----------------------------------------------------------------------------- |
| `npm run dev`          | Start the API and web development servers                                     |
| `npm run build`        | Build contracts, API, client, and worker placeholder                          |
| `npm run lint`         | Run ESLint                                                                    |
| `npm run format:check` | Check Prettier formatting                                                     |
| `npm run typecheck`    | Typecheck all workspaces                                                      |
| `npm test`             | Run API configuration, health, and error tests                                |
| `npm run db:indexes`   | Connect to MongoDB and report registered indexes; no domain indexes exist yet |
| `npm run worker`       | Run the worker placeholder; no queue processors are registered                |

## Health checks

- `GET /health/live` returns 200 while the API process is serving requests.
- `GET /health/ready` returns 200 only when MongoDB and Redis are ready, otherwise 503. Its response reports booleans only and contains no connection details.
- `/api/v1` is the versioned route boundary. Unimplemented routes return a standardized 404; no future business endpoint is stubbed as successful.

Tests use injected dependency states and do not require Docker or external services. Running the API itself requires reachable MongoDB and Redis. The CI workflow runs install, lint, formatting, typecheck, tests, and builds; it does not start external services.

See [architecture](docs/architecture.md), [decision log](docs/decisions.md), and [service dependencies](docs/services.md) for boundaries, deferred integrations, and service expectations.
