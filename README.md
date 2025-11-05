# GameMod Platform

GameMod is a communication and ticketing platform tailored to game studios that need streamlined operations, analytics, and moderation tooling.

## Monorepo Structure

- `apps/backend` – Fastify + TypeScript service exposing REST/WebSocket surfaces. Includes environment validation, route scaffolding, and database plugin stubs.
- `apps/frontend` – React + Vite + Tailwind dashboard with D3-driven analytics, query caching, and placeholder views.
- `docs/` – Architecture and planning references.

## Getting Started

### Prerequisites

- Node.js 20+
- npm >= 9 (workspace support)

### Install Dependencies

```bash
npm install
```

> The repo uses npm workspaces; dependency installs will populate both apps.

### Environment

Create `apps/backend/.env` (or export variables) with:

```dotenv
PORT=3000
DATABASE_URL=postgres://gamemod:gamemod@localhost:5544/gamemod
REDIS_URL=redis://localhost:6379
ADMIN_PASSWORD=changeme123
```

`DATABASE_URL` now drives ticket persistence—make sure it points at the Postgres instance started below.

### Database (local)

Spin up Postgres on a non-standard port and run migrations:

```bash
docker compose up -d postgres
npm run migrate:up
```

This provisions Postgres 16 with credentials `gamemod/gamemod` on `localhost:5544` and applies the tickets schema. Shut it down with `docker compose down` when finished.

### Development Servers

Start the API and dashboard in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Both commands block the terminal they run in—open separate shells or append `>& logs &` to run them in the background:

```bash
npm run dev:backend > backend.log 2>&1 &
npm run dev:frontend > frontend.log 2>&1 &
```

Use `tail -f backend.log` or `tail -f frontend.log` to follow output, and stop the processes with `pkill -f "ts-node-dev"` / `pkill -f "vite"` or by killing their PIDs.

The backend listens on `http://localhost:3000` (health endpoint at `/health`).  
The frontend runs via Vite at `http://localhost:5173` and surfaces API health in the header.

### Available Scripts

- `npm run dev:backend` – Start Fastify server with `ts-node-dev`.
- `npm run dev:frontend` – Launch Vite dev server with hot module reloading.
- `npm run build` – Type-check and build all workspaces.
- `npm run lint` – Run ESLint across backend and frontend.
- `npm run format` – Format source files via Prettier.
- `npm run migrate:up` – Apply database migrations (requires `DATABASE_URL`).
- `npm run migrate:down` – Roll back the latest migration.

## Cloud Deployment (Google Cloud)

The production topology targets:

- **Backend/API** → Cloud Run (container built from `apps/backend/Dockerfile`)
- **Database** → Cloud SQL for PostgreSQL
- **Frontend** → Firebase Hosting (static build produced by Vite)

### 1. Prerequisites

```bash
gcloud auth login
gcloud config set project YOUR_GCP_PROJECT_ID
gcloud services enable run.googleapis.com sqladmin.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com
firebase login
```

Set a few reusable shell variables for subsequent commands:

```bash
export REGION=us-central1               # pick the region you want
export ARTIFACT_REPO=gamemod-api        # artifact registry name for backend images
export SERVICE_NAME=gamemod-api         # Cloud Run service name
export INSTANCE_ID=gamemod-sql          # Cloud SQL instance name
export DB_NAME=gamemod
export DB_USER=gamemod_app
export DB_PASSWORD='choose-a-strong-password'
export PROJECT_ID=$(gcloud config get-value project)
export CONNECTION_NAME="${PROJECT_ID}:${REGION}:${INSTANCE_ID}"
```

### 2. Provision Cloud SQL (PostgreSQL)

```bash
gcloud sql instances create "$INSTANCE_ID" \
  --database-version=POSTGRES_15 \
  --tier=db-custom-1-3840 \
  --region="$REGION" \
  --storage-auto-increase \
  --backup \
  --enable-point-in-time-recovery

gcloud sql databases create "$DB_NAME" --instance "$INSTANCE_ID"
gcloud sql users create "$DB_USER" --instance "$INSTANCE_ID" --password "$DB_PASSWORD"
```

### 3. Build and push the backend image

First create an Artifact Registry (if it does not already exist):

```bash
gcloud artifacts repositories create "$ARTIFACT_REPO" \
  --repository-format=docker \
  --location="$REGION"
```

Then build and publish the container (runs from the repo root):

```bash
gcloud builds submit . \
  --tag "${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/backend:latest" \
  --file apps/backend/Dockerfile
```

### 4. Deploy the Cloud Run service

Construct a Cloud SQL connection string that uses the Unix domain socket exposed by Cloud Run:

```bash
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${CONNECTION_NAME}"
```

Deploy the service with the Cloud SQL connector attached and HTTPS enabled:

```bash
gcloud run deploy "$SERVICE_NAME" \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/backend:latest" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances "$CONNECTION_NAME" \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=${DATABASE_URL},ADMIN_PASSWORD=$(openssl rand -base64 32)"
```

Cloud Run supplies the `PORT` environment variable automatically; the Fastify app listens on it.

### 5. Run database migrations in Cloud Run

Use a one-off Cloud Run job that reuses the same container image and attaches the Cloud SQL connector:

```bash
gcloud run jobs create gamemod-migrate \
  --image "${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/backend:latest" \
  --region "$REGION" \
  --add-cloudsql-instances "$CONNECTION_NAME" \
  --set-env-vars "NODE_ENV=production,DATABASE_URL=${DATABASE_URL}" \
  --command npm --args "run","migrate:up"

gcloud run jobs execute gamemod-migrate --region "$REGION"
```

Re-run the job whenever new migrations ship.

### 6. Deploy the frontend to Firebase Hosting

1. Create `apps/frontend/.env.production` (or set the variable inline) so Vite embeds the Cloud Run URL:

   ```dotenv
   VITE_API_BASE_URL=https://YOUR_CLOUD_RUN_URL
   ```

2. Build and deploy:

   ```bash
   firebase use YOUR_FIREBASE_PROJECT_ID
   VITE_API_BASE_URL=https://YOUR_CLOUD_RUN_URL npm run deploy:frontend
   ```

   The `predeploy` hook in `firebase.json` triggers the Vite build before files are uploaded.

### 7. Grant Firebase Hosting access to the API

The backend enables CORS for all origins by default. If you want to restrict it to Firebase domains, tighten the configuration in `apps/backend/src/app.ts`.

---

Once deployed, the Cloud Run service exposes the API over HTTPS, Firebase Hosting serves the static frontend, and the two communicate through the URL you injected into the Vite build. Use Cloud Run revisions for rollbacks and Cloud SQL automated backups for data recovery.

## Roadmap Notes

Refer to `docs/architecture.md` for the detailed system plan, milestones, and open questions guiding the next implementation phases.
