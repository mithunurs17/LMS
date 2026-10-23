# Architecture

The repository is an npm-workspace modular monolith. Deployable processes live under `apps/`; code shared across processes lives under `packages/`. Phase 1 establishes boundaries and runtime foundations without implementing product workflows.

```text
apps/web        React + Vite + Redux Toolkit client
       | HTTPS / JSON
apps/api        Express + TypeScript API, versioned under /api/v1
       |                    |
packages/contracts       MongoDB + Redis
apps/worker      reserved process entry point; no queues are registered yet
```

The API owns environment validation, HTTP middleware, health checks, and MongoDB/Redis lifecycle. `packages/contracts` owns shared domain vocabulary, API envelopes, and reusable Zod conventions. The web app consumes a Redux store but has no business slices yet. Worker and domain-process integrations remain intentionally inactive until their planned phases.

Requests receive a generated request ID. Helmet sets security headers; CORS uses an explicit origin allowlist; JSON request bodies are limited to 1 MiB. Errors use a stable `{ success: false, error: { code, message, requestId } }` envelope and do not expose unexpected exception details. The `/api/v1` router is an empty version boundary until product modules are implemented; unmatched routes return a standardized 404.

`/health/live` reports process liveness. `/health/ready` returns 200 only while both MongoDB and Redis are ready, otherwise 503 with boolean checks and no connection details. Health routes are infrastructure probes, outside the versioned business API.
