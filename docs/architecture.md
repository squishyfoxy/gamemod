# GameMod Platform Architecture

## Purpose
GameMod is a lightweight, game-native communication and ticketing hub built for small to mid-size studios. It gives teams a managed or self-hosted option to organise player support, moderation, and live ops without inheriting the clutter of generic community tools.

## Product Goals
- **Team-centric operations** – multi-tenant workspaces with admins, moderators, and cross-team collaboration features.
- **Unified inbox** – tickets, structured player messages, and staff chatter in one surface with clear context and history.
- **Actionable analytics** – dashboards for player activity, SLA tracking, escalation trends, and moderator workload.
- **Plug-and-play integrations** – SDKs for game scripting environments, Discord OAuth login, webhooks, email bridge, and optional Discord channel mirroring.
- **Deploy anywhere** – default managed deployment on Google Cloud Run with Cloud SQL; self-hosted installation uses the same binaries and IaC.

## System Overview
```
Players / Game Clients ──> REST & WebSocket API ──┐
Discord OAuth & Events ──> Auth Service          │
Email / Webhooks ────────> Intake Workers        │
                                                ▼
             Fastify App (Cloud Run)
             ├─ HTTP API (REST + WebSocket)
             ├─ Auth & RBAC Enforcement
             ├─ Ticket & Messaging Service Layer
             ├─ Analytics Query Layer
             └─ Background Jobs (Pub/Sub / Tasks)
                                                ▼
        Cloud SQL (PostgreSQL)  ── primary data store
        Redis (Memorystore)     ── sessions, rate limits, presence
        Cloud Storage           ── attachments & exports
        Pub/Sub / Cloud Tasks   ── async processing, notifications
```

## Key Components
- **Frontend (React + TypeScript + Tailwind + D3)**  
  Deployed as static assets behind Cloud CDN. Consumes the API, renders dashboards, offers a PWA for moderators, and streams live updates via WebSocket/EventSource.
- **Backend (Fastify + TypeScript + pure SQL)**  
  Deployed on Cloud Run. Uses the `pg` driver with hand-written queries, `zod` for DTO validation, and `node-pg-migrate` for schema migrations. Socket.IO (or bare ws) provides real-time ticket and messaging updates.
- **Data Layer (PostgreSQL)**  
  Multi-tenant schema anchored by `organizations` with strict row-level policies. Materialized views or scheduled rollups support analytics without overloading primaries.
- **Caching & Coordination (Redis)**  
  Stores session tokens, rate limit counters, and live presence data. Also backs distributed locks for background job deduplication.
- **Async Workers (Pub/Sub or Cloud Tasks + Cloud Run Jobs)**  
  Handle email ingestion, Discord sync, SLA timers, and webhook fan-out while keeping the HTTP surface responsive.
- **File Storage (Cloud Storage)**  
  Tracks signed URLs for ticket attachments, exports, and analytics snapshots.

## Data Model Snapshot
- `organizations`, `teams`, `memberships`, `roles`, `permissions` – multi-tenant RBAC.
- `users`, `auth_providers`, `discord_accounts` – identity with Discord OAuth2 linking.
- `tickets`, `ticket_events`, `ticket_assignments`, `ticket_notes`, `attachments` – full ticket lifecycle and history.
- `message_channels`, `messages`, `message_reactions` – structured player/staff communications.
- `player_profiles`, `player_sessions`, `player_reports` – game context and moderation data.
- `audit_logs`, `webhook_subscriptions`, `api_tokens`, `integrations` – compliance and extensibility.
- Materialized views for ticket SLA metrics, team workload, sentiment, and engagement trends.

## Integration Points
- **Discord OAuth2** for login and optional role syncing; read-only Discord bridge to avoid infinite loops.
- **Game SDKs** for Lua, JS, and C# mods enabling in-game ticket submission, announcements, and player status checks.
- **Webhooks & API Tokens** for studio automation, custom dashboards, and server-to-server integrations.
- **Email Ingest** to convert support emails into tickets with attachment support and reply threading.

## Security & Compliance
- OAuth2 state + PKCE, rotating refresh tokens, optional TOTP for staff.
- Combination of application checks and database row-level security to enforce tenant boundaries.
- Comprehensive audit logging for moderation actions, ticket updates, and permission changes.
- Rate limiting per user and per game/server key; anomaly detection alerts for spam or abuse.
- Configurable data retention policies to align with studio requirements and regulations.

## Deployment & Operations
- **Infrastructure as Code** via Terraform modules covering Cloud Run services, Cloud SQL, Redis, Pub/Sub, Storage, logging, and monitoring.
- **CI/CD** using GitHub Actions: lint, unit/integration tests, static analysis, build docker images, push to Artifact Registry, deploy with controlled rollouts.
- **Observability** with structured logging, OpenTelemetry traces, Prometheus-compatible metrics, and health checks exposed at `/health` and `/ready`.
- **Local development** supported via Docker Compose mirroring the production topology (Fastify app, Postgres, Redis, worker process).

## Delivery Roadmap (High Level)
1. **Foundation** – Discord auth, org/team membership, ticket CRUD, minimal React admin shell, Cloud Run scaffolding.
2. **Collaboration** – Messaging workspace, ticket assignments, notifications, file attachments, moderator presence indicators.
3. **Analytics** – Aggregated metrics, D3 dashboards, CSV exports, alerting for SLA breaches.
4. **Integrations** – Game SDKs, Discord bridge, webhooks, automation rules engine.
5. **Polish & Packaging** – Load testing, PWA features, documentation, managed hosting add-ons, self-hosting guides.

## Next Questions
- Which communities will pilot the MVP, and what bespoke workflows do they require?
- Are there compliance constraints (e.g., GDPR data residency) that influence hosting regions?
- What SLA targets do moderators expect, and how should breach notifications behave?
- How opinionated should the automation/rules layer be, and is scripting support required at launch?
