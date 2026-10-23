# Service Dependencies

| Service                     | Phase 1 use                                             | Local option                   | Required for API readiness | Test scope                                                                            |
| --------------------------- | ------------------------------------------------------- | ------------------------------ | -------------------------- | ------------------------------------------------------------------------------------- |
| MongoDB                     | Connection lifecycle; domain storage is not implemented | `docker compose up -d mongodb` | Yes                        | Config and health tests are local-only and do not need MongoDB; live API startup does |
| Redis                       | Connection lifecycle; queues are not implemented        | `docker compose up -d redis`   | Yes                        | Config and health tests are local-only and do not need Redis; live API startup does   |
| Object storage / CloudFront | Not configured                                          | External setup deferred        | No                         | Not applicable in Phase 1                                                             |
| BullMQ / FFmpeg             | Not configured; worker has no consumers                 | External setup deferred        | No                         | Not applicable in Phase 1                                                             |
| LiveKit                     | Not configured                                          | External setup deferred        | No                         | Not applicable in Phase 1                                                             |

Compose services are unauthenticated and bound to `127.0.0.1`; do not expose this setup to a shared or production network.
