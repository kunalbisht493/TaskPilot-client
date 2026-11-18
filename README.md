# TaskPilot Client — Agentic Observability Cockpit

TaskPilot Client is the interactive, real-time React 19 frontend for **TaskPilot** — an autonomous MERN AI agent that plans, schedules, and executes tasks using a hand-built ReAct (Reason → Act → Observe) loop.

While traditional conversational AI interfaces display only a spinner followed by a final text paragraph ("AI that talks"), the TaskPilot client is an **agentic observability dashboard ("AI that acts")**. It renders the agent's internal reasoning cycle in real time, intercepts state-mutating actions before execution via a Human-in-the-Loop (HITL) confirmation modal, manages internal database tasks, and streams an immutable audit trail live from MongoDB over WebSockets.

---

## Key Features

1. **Live ReAct Execution Feed:**
   - **Reason (🧠):** Streams the model's sub-goal plan, internal reflections, and strategy before acting.
   - **Act (⚡):** Visualizes structured tool invocations with schema-validated arguments and write-action safety badges.
   - **Observe (👁️):** Renders output from external services (Google Calendar availability, task database mutations).
   - **Answer Card:** Clean summary card with formatted meeting cards, clickable Google Meet links, and conflict badges.

2. **Human-in-the-Loop (HITL) Safety Guardrail:**
   - Write actions (`create_calendar_event`, `create_task`, `complete_task`) halt the agent loop.
   - A high-visibility confirmation modal displays exact parameters (times, titles, attendees) for explicit **Approve** or **Reject** decisions.

3. **1-Click Demo Evaluation Mode:**
   - Solves the unverified Google OAuth app barrier: evaluators, HR, and interviewers can click **Demo** in the header to instantly access the full agent experience.
   - Powered by a backend in-memory calendar sandbox pre-seeded with meetings, full conflict/overlap detection, and MongoDB task seeding with zero Google credentials required.

4. **Dual-Domain Workspace (Tasks & Audit Trail):**
   - **Database Tasks:** Live to-do list with status filters (`All`, `Pending`, `Completed`), inline creation, and real-time synchronization.
   - **Action Audit Log:** Immutable action ledger with performance metrics (total calls, confirmed count, success rate) and expandable details.

5. **Multi-Account Session Hygiene:**
   - Complete `localStorage` and memory cache purge on logout and account switch, ensuring data from demo sessions never leaks into Google accounts.

---

## Tech Stack

- **Framework:** React 19 (Vite 8)
- **Styling:** Tailwind CSS v3, PostCSS, Autoprefixer
- **Icons:** Lucide React
- **Transport:** Socket.io-client (port 5001) + Fetch REST client with `credentials: 'include'`
- **Typography:** Inter & JetBrains Mono (Google Fonts)
- **Deployment:** Vercel SPA mode with rewrite rules (`vercel.json`)

---

## Getting Started

### Prerequisites

- **Node.js:** v24.22.1 (managed via NVM: `nvm use 24`)
- **Backend:** `TaskPilot-server` running on `http://localhost:5001`

### Installation

```bash
# Clone the repository
git clone https://github.com/kunalbisht493/TaskPilot-client.git
cd TaskPilot-client

# Install dependencies
npm install
```

### Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

| Variable | Description | Local Dev Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the TaskPilot backend API | Leave blank (Vite proxies `/api` to `http://localhost:5001`) |
| `VITE_WS_URL` | WebSocket gateway URL | Leave blank (falls back to `http://localhost:5001`) |

### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5174`.

### Production Build & Linting

```bash
# Run Oxlint
npm run lint

# Compile production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## Evaluation & Testing Guide

| Mode | How to Access | What It Proves |
|---|---|---|
| **1-Click Demo Mode** | Click the **Demo** button in the header (beside *Architecture*) | Full ReAct loop, calendar availability checking, double-booking prevention, HITL confirmation modal, MongoDB task management, and live audit streaming without Google login. |
| **Google OAuth Mode** | Click **Sign in with Google** | Live synchronization with real Google Calendar API (v3) using OAuth 2.0 PKCE. *(Note: If app is unverified in Google Cloud Console, click Advanced → Go to TaskPilot).* |

---

## Related Documentation

- [`architecture.md`](architecture.md): Component hierarchy, data flow diagram, WebSocket contracts, and design system.
- [`decision.md`](decision.md): Complete Architectural Decision Records (ADR-C001 to ADR-C029).
- [`projectcontext.md`](projectcontext.md): UX philosophy, user stories, and scoping boundaries.
