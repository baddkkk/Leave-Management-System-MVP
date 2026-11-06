# LeaveFlow — Leave Management System

A full-stack HR web application for managing employee leave requests. Employees submit leave requests, admins review and approve or reject them, and both parties receive email notifications throughout the process.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Models](#database-models)
- [API Reference](#api-reference)
- [Authentication Flow](#authentication-flow)
- [Role System](#role-system)
- [Running the Project](#running-the-project)
- [Environment Variables](#environment-variables)
- [Development Notes](#development-notes)

---

## Overview

LeaveFlow is a containerized full-stack application built with **React + Vite** on the frontend and **FastAPI + SQLAlchemy** on the backend. It is fully Dockerized and orchestrated with Docker Compose, including a local mail server (MailHog) for development email testing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS, Axios, React Router v7 |
| Backend | FastAPI, SQLAlchemy, Pydantic, Uvicorn |
| Database | MySQL 8.0 (via SQLAlchemy ORM + PyMySQL) |
| Email | SMTP + MailHog (dev) |
| Containerization | Docker, Docker Compose |
| Web Server | Nginx (serves built React app) |

---

## Architecture

```
Browser
   │
   ▼
Nginx (port 3000)          ← Serves the built React app
   │
   │  API calls (/api/...)
   ▼
FastAPI Backend (port 8000) ← Handles business logic
   │
   ├── MySQL Database (port 3306) ← Persists users and leave requests
   │
   └── MailHog (port 8025)  ← Catches outgoing emails in dev
```

The frontend and backend run as separate Docker containers. Nginx proxies API calls from the frontend to the backend, so the browser only ever talks to one origin.

---

## Features

### Employee
- Sign up and log in with two-step email verification
- Submit leave requests with reason, start date, and end date
- View personal leave history with status tracking
- Receive email notifications when a request is approved or rejected

### Admin
- View all employee leave requests across the organization
- Approve or reject pending requests with one click
- Search requests by name, email, or reason
- Filter requests by status (pending / approved / rejected)
- See live stats: total pending, approved, and rejected counts

### General
- Two-factor login: password + email verification code
- Protected routes (unauthenticated users are redirected to login)
- Skeleton loaders while data is fetching
- Toast notifications for actions
- Fully responsive UI

---

## Project Structure

```
leave management system/
├── backend/
│   ├── main.py          # FastAPI app, all routes and business logic
│   ├── models.py        # SQLAlchemy ORM models (User, LeaveRequest)
│   ├── schemas.py       # Pydantic request/response schemas
│   ├── database.py      # Database connection and session setup
│   ├── requirements.txt # Python dependencies
│   └── Dockerfile
│
├── frontend/
│   └── vite-project/
│       ├── src/
│       │   ├── App.jsx              # Root component, routing, auth state
│       │   ├── pages/
│       │   │   ├── Login.jsx        # Sign in / sign up + verification
│       │   │   ├── Dashboard.jsx    # Leave list, stats, admin actions
│       │   │   └── SubmitLeave.jsx  # Leave request form
│       │   └── lib/
│       │       └── api.js           # API base URL config
│       ├── Dockerfile
│       └── nginx.conf               # Nginx config for production serving
│
└── docker-compose.yml
```

---

## Database Models

### User
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| first_name | String | User's first name |
| last_name | String | User's last name |
| email | String | Unique email address |
| password_hash | String | SHA-256 hashed password |
| role | String | `admin` or `employee` |
| created_at | DateTime | Account creation timestamp |

### LeaveRequest
| Column | Type | Description |
|--------|------|-------------|
| id | Integer | Primary key |
| name | String | Requester's name |
| email | String | Requester's email |
| user_id | Integer | Foreign reference to user |
| reason | Text | Reason for leave |
| start_date | String | Leave start date |
| end_date | String | Leave end date |
| status | String | `pending`, `approved`, or `rejected` |
| created_at | DateTime | Submission timestamp |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/signup` | Create a new account |
| `POST` | `/login` | Validate credentials, send verification code |
| `POST` | `/verify-login` | Complete login with verification code |
| `GET` | `/leaves` | Get all leaves (admin) or by email (employee) |
| `POST` | `/leave` | Submit a new leave request |
| `PUT` | `/leave/{id}/status` | Update leave status (admin only) |

Interactive API docs are available at `http://localhost:8000/docs` when the backend is running.

---

## Authentication Flow

```
1. User submits email + password  →  POST /login
2. Backend verifies credentials
3. Backend generates a 6-char code, stores it in memory, sends it by email
4. User submits the code          →  POST /verify-login
5. Backend validates the code and returns user data
6. Frontend stores user data in localStorage
7. All subsequent requests use the stored session
```

> **Dev mode:** When `DEV_SHOW_TOKEN=1`, the verification code is also returned directly in the API response so you can test without checking MailHog.

---

## Role System

Roles are assigned automatically at signup:

- If the email contains `"admin"` → role is `admin`
- Otherwise → role is `employee`

**Admin capabilities:** view all requests, approve/reject pending requests.  
**Employee capabilities:** view own requests only, submit new requests.

---

## Running the Project

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Start

```bash
docker compose up --build
```

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| MailHog (email inbox) | http://localhost:8025 |
| MySQL | localhost:3306 (user: `leaveflow`, pass: `leaveflow_pass`) |

### Stop

```bash
docker compose down
```

### Run in background

```bash
docker compose up --build -d
```

---

## Environment Variables

Configured in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `db` | MySQL host (Docker service name) |
| `DB_PORT` | `3306` | MySQL port |
| `DB_USER` | `leaveflow` | MySQL username |
| `DB_PASSWORD` | `leaveflow_pass` | MySQL password |
| `DB_NAME` | `leaveflow_db` | MySQL database name |
| `SMTP_SERVER` | `mailhog` | SMTP host for sending emails |
| `SMTP_PORT` | `1025` | SMTP port |
| `SMTP_USERNAME` | `` | SMTP username (leave empty for MailHog) |
| `SMTP_PASSWORD` | `` | SMTP password (leave empty for MailHog) |
| `SMTP_USE_SSL` | `0` | Set to `1` to use SMTP over SSL |
| `EMAIL_FROM` | `no-reply@leaveflow.local` | Sender address for outgoing emails |
| `DEV_SHOW_TOKEN` | `1` | Return verification code in API response |
| `ALLOWED_ORIGINS` | `http://localhost:3000,http://127.0.0.1:3000` | CORS allowed origins |

---

## Development Notes

- **MySQL 8.0** is used as the database. Data is persisted in a Docker named volume (`mysql_data`) so it survives container restarts.
- **The backend waits for MySQL** to be healthy before starting, using both a Docker healthcheck and an in-app retry loop.
- **Passwords** are hashed with SHA-256. For production, use `bcrypt` or `argon2`.
- **Tokens** are stored in memory (`dict`). A server restart clears all pending verification codes. For production, use Redis or a database-backed token store.
- **Role assignment** is based on email string matching. For production, roles should be explicitly set by an admin.
- **MailHog** is a local fake SMTP server. To use real email in production, set `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, and `SMTP_USE_SSL` accordingly.

---

## Author

**Badr Sekkat**  
Software Engineering Student — ENSET Mohammedia  
[LinkedIn](#) · [GitHub](#)
