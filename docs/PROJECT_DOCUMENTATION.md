# Real-Time Email Scheduler — Project Documentation

This project is a full-stack “send now / schedule later” email system built around a **queue + worker** architecture, with a **real-time dashboard** showing job status.

---

## 1) What you built (in 1 minute)

You have three main moving parts:

1. **Frontend (React/Vite)**: UI to compose emails and view job history/status.
2. **API server (Node/Express + Socket.IO)**: REST endpoints to create jobs and read job history, and a WebSocket server to broadcast job lifecycle events.
3. **Worker (BullMQ Worker)**: background process that actually sends the email when BullMQ releases the job (immediately or after a delay).

Supporting services:

- **Redis**: stores the BullMQ queue + delayed jobs.
- **PostgreSQL**: stores durable job records and job event timeline.
- **MailHog (dev)**: captures outgoing emails so you can view them in a browser.

---

## 2) Repository structure

Top-level folders:

- `frontend/` — React + Vite UI
- `backend/` — Docker Compose + Node backend code (`backend/app/`)

Backend code layout (`backend/app/`):

- `server.js` — Express API + Socket.IO server
- `worker.js` — BullMQ worker that processes queued jobs
- `routes/` — HTTP routes
- `controllers/` — route handlers (enqueue jobs, query jobs, retry/delete)
- `jobs/` — BullMQ queue configuration + processors
- `services/` — email sending logic
- `utils/` — Redis + Nodemailer transport
- `db/` — Knex connection + migrations

Frontend layout (`frontend/src/`):

- `main.jsx` / `App.jsx` — app bootstrap and routes
- `pages/ComposePage.jsx` — “Compose Email” page
- `components/Dashboard.jsx` — dashboard view (table + job details)
- `hooks/useSocket.js` — Socket.IO client connection
- `hooks/useJobs.js` — fetch jobs + refresh on socket events
- `services/emailApi.js` / `services/jobsApi.js` — Axios calls to backend

---

## 3) How to run locally (recommended)

### 3.1 Start backend services (Docker Compose)

From `backend/`:

```bash
docker compose up --build
```

This starts:

- API server: `http://localhost:3000`
- Redis: `localhost:6379`
- Postgres: `localhost:5432`
- Worker: connects to Redis + API WebSocket
- MailHog UI: `http://localhost:8025` (SMTP on `localhost:1025`)

### 3.2 Configure and start the frontend

The frontend expects an environment variable:

- `VITE_API_BASE` — base URL for **both** Axios and Socket.IO client

Create `frontend/.env`:

```bash
VITE_API_BASE=http://localhost:3000
```

Then from `frontend/`:

```bash
npm install
npm run dev
```

Vite prints the local dev URL (usually `http://localhost:5173`).

---

## 4) Main workflows (end-to-end)

### Workflow A — “Send now”

1. User fills the “Compose Email” form and chooses **Send now**.
2. Frontend calls `POST /api/send-email`.
3. API enqueues a BullMQ job in Redis (attempts + exponential backoff).
4. API inserts a row into Postgres table `jobs` and a `job_events` entry (`queued`).
5. API broadcasts `job:queued` via Socket.IO.
6. Worker receives job from Redis and marks it **active** in Postgres + inserts `started` event.
7. Worker sends the email via Nodemailer (MailHog in dev).
8. Worker marks job **completed** (or **failed**) and writes a `completed`/`failed` event.
9. Worker emits `job:started`, `job:completed`, or `job:failed` so the dashboard refreshes live.

### Workflow B — “Schedule for later”

1. User chooses **Schedule** and selects a local datetime.
2. Frontend converts that datetime to **UTC ISO string** (`toISOString()`).
3. Frontend calls `POST /api/schedule-email` with `sendAt`.
4. API computes `delay = sendAt - now` and creates a delayed BullMQ job.
5. The job sits in Redis until it is due, then the worker processes it the same way as “Send now”.

### Workflow C — “Retry failed job”

1. Dashboard calls `POST /api/jobs/:id/retry` for a job whose status is `failed`.
2. API creates a **new** BullMQ job with the same email payload.
3. API inserts a new `jobs` row and records a `requeued` event.

### Workflow D — “Delete job”

1. Dashboard calls `DELETE /api/jobs/:id`.
2. API tries to remove the job from BullMQ (if still present).
3. API deletes the job and its events from Postgres.

---

## 5) Backend API reference

Base URL: `http://localhost:3000`

### Send immediately

- `POST /api/send-email`
- Body:
  - `to` (string)
  - `subject` (string)
  - `body` (string)
- Response: `{ queued: true, jobId: "..." }`

### Schedule for later

- `POST /api/schedule-email`
- Body:
  - `to` (string)
  - `subject` (string)
  - `body` (string)
  - `sendAt` (string, ISO datetime in the future; recommended UTC via `toISOString()`)
- Response: `{ scheduled: true, jobId: "..." }`

### List jobs (dashboard table)

- `GET /api/jobs`
- Response: array of job rows from Postgres (most recent first)

### Job details + timeline (modal)

- `GET /api/jobs/:id`
- Response:
  - `job` — row from `jobs`
  - `events` — ordered rows from `job_events`

### Stats (not currently used by UI)

- `GET /api/stats`
- Response: grouped counts by `status`

### Retry failed job

- `POST /api/jobs/:id/retry`
- Notes: only allowed when `status === "failed"`

### Delete job

- `DELETE /api/jobs/:id`

---

## 6) Real-time events (Socket.IO)

The API server runs Socket.IO on the same host/port as the REST API (`http://localhost:3000`).

Frontend listens for:

- `job:queued`
- `job:started`
- `job:completed`
- `job:failed`

When any of these are received, the frontend re-fetches `GET /api/jobs` to refresh the table.

---

## 7) Database schema (PostgreSQL via Knex migrations)

### `jobs` table (`backend/app/db/migrations/001_create_jobs.js`)

- `id` (string, primary key) — uses BullMQ job id
- `type` (string) — `send` or `scheduled`
- `to_email`, `subject`, `body`
- `status` — `queued` | `active` | `completed` | `failed`
- `attempts` (int), `failed_reason` (text)
- `queued_at`, `started_at`, `completed_at` (timestamps)

### `job_events` table (`backend/app/db/migrations/002_create_job_events.js`)

- `id` (auto increment)
- `job_id` (string)
- `event_type` — `queued`, `started`, `completed`, `failed`, `requeued`
- `data` (jsonb) — optional metadata (error, sendAt, etc.)
- `created_at` (timestamp)

---

## 8) Background processing (BullMQ)

Queue:

- `backend/app/jobs/emailQueue.js` creates a BullMQ queue named `emailQueue`.

Worker:

- `backend/app/worker.js` starts a BullMQ `Worker("emailQueue", ...)`.
- It listens to `active`, `completed`, `failed` events and:
  - updates `jobs` table
  - inserts `job_events`
  - emits Socket.IO events (via a Socket.IO client connected to the API server)

Processor:

- `backend/app/jobs/processors/sendEmail.js` calls `emailService.send(...)`.

---

## 9) Email delivery in development (MailHog)

In Docker Compose, SMTP is set to:

- Host: `mailhog`
- Port: `1025`

MailHog inbox UI:

- `http://localhost:8025`

So when the worker sends an email, you’ll see it in MailHog instead of a real inbox.

---

## 10) Notes / gotchas found during analysis

1. **Frontend socket hook is used twice**:
   - `App.jsx` already creates a socket and passes it into `Dashboard`.
   - `Dashboard.jsx` currently creates a second socket and doesn’t use the prop.
   - This can prevent live refresh from working as intended.

2. **Backend DB connection is hard-coded in `backend/app/db/knex.js`**:
   - Docker Compose works because service names (`postgres`) are resolvable inside the Docker network.
   - If you want to run backend outside Docker, you’ll likely want to use env vars consistently (the repo also has `knexfile.js` that already reads env vars).

3. **Prisma config exists but doesn’t appear to be used**:
   - `backend/app/prisma.config.js` references Prisma, but the app uses Knex migrations for tables.

---

## 11) If you want, I can also

- Fix the frontend socket/dashboard wiring so “Live” updates always work.
- Add a “Stats” row to the dashboard using `GET /api/stats`.
- Add `.env.example` files for frontend and backend.

