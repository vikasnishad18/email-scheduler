# Real-Time Email Scheduler & Queue System

A backend system for sending and scheduling emails using a reliable job queue, background workers, and real-time updates.

This project demonstrates how modern backend systems handle delayed jobs, retries, persistence, and live status tracking.

---

## What This System Does

- Send emails immediately or schedule them for future delivery
- Process emails asynchronously using background workers
- Retry failed jobs automatically with exponential backoff
- Track job lifecycle (queued → processing → completed / failed)
- Push real-time job updates to the frontend using WebSockets
- Persist job state and history in a database

---

## High-Level Architecture

Frontend (React)  
→ REST API + WebSocket  
→ API Server (Node.js / Express)  
→ Redis Queue (BullMQ)  
→ Worker Service  
→ SMTP Email Provider  

PostgreSQL stores durable job state and event history independently of the queue.

---

## Tech Stack

**Backend**
- Node.js + Express
- BullMQ (Redis-based job queue)
- Redis (job storage & scheduling)
- PostgreSQL (persistent job state)
- Knex.js (SQL query builder)
- Socket.IO (real-time events)
- Docker & Docker Compose

**Frontend**
- React (Vite)
- Tailwind CSS
- Axios
- Socket.IO Client

---

## Key Engineering Concepts Demonstrated

- Asynchronous job processing
- Delayed job scheduling
- Worker isolation from API layer
- Retry & backoff strategies
- Queue + database consistency
- Real-time system observability
- Dockerized local development

---

## How Scheduling Works (Brief)

1. User schedules an email from the UI  
2. Frontend converts local time → UTC  
3. API enqueues job with a calculated delay  
4. Redis holds delayed job until execution time  
5. Worker processes job and sends email  
6. Job state is updated in PostgreSQL  
7. Frontend receives live updates via WebSocket  

---

## Local Development

### Requirements
- Docker
- Docker Compose

### Run Backend
```bash
docker compose up --build
