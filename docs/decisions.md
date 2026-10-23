# Decision Log

## 2026-10-22: Keep the npm workspace and service boundaries

Use npm workspaces with `apps/api`, `apps/web`, `apps/worker`, and `packages/contracts`. The checked-in lockfile already described these packages and pinned the intended stack, while package manifests and source were absent. Reconstruct the manifests from those lockfile entries rather than introducing another package manager or replacing the intended stack.

## 2026-10-22: Defer product integrations

Phase 1 provides shared types, validation conventions, process boundaries, and dependency health only. Authentication, queue consumers, media processing/FFmpeg, CloudFront delivery, LiveKit sessions, and commerce workflows are not implemented or represented as working integrations.

## 2026-10-22: Keep local infrastructure development-only

Compose exposes MongoDB and Redis on loopback with persistent named volumes and no credentials. This is for local development only; production deployments must use managed services, authentication, network controls, and secret management.
