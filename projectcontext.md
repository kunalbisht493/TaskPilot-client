# TaskPilot Client — Project Context

## What This Is

TaskPilot Client is the interactive, real-time React frontend for **TaskPilot** — an autonomous MERN AI agent that plans, schedules, and executes tasks using a hand-built ReAct (Reason → Act → Observe) loop.

While traditional AI applications are opaque conversational chat boxes ("AI that talks"), the TaskPilot client is an **agentic observability cockpit ("AI that acts")**. It exposes the internal reasoning steps of the agent in real time, intercepts mutating actions before execution via a Human-in-the-Loop (HITL) modal, manages internal database tasks, and streams an immutable audit trail live from MongoDB over WebSockets.

---

## Purpose & UX Philosophy

1. **Demystifying Agent Reasoning:**
   Standard chat UIs hide the AI's internal reasoning. TaskPilot Client renders every ReAct cycle step explicitly:
   - **Reason:** The model's sub-goal plan and internal reflection.
   - **Act:** The structured tool invocation with schema-checked parameters and write-action safety badges.
   - **Observe:** The execution output received from external APIs (Google Calendar) or internal services (Task DB).
   
2. **Safety & User Agency Through HITL Guardrails:**
   Autonomous agents risk unintended state mutation. TaskPilot places the user in control: whenever a write action is proposed, the UI halts the conversation flow with a high-visibility confirmation modal displaying exact action parameters (event times, task titles) for one-click Approval or Rejection.

3. **Dual-Domain Direct Workspace:**
   Provides an interactive workspace where users can monitor their database tasks and action audit logs side-by-side with the live agent stream, allowing users to verify that tool actions immediately take effect.

---

## Primary User Stories

- **As a User**, I want to submit complex scheduling or task management goals in natural language so the agent can execute multi-step workflows.
- **As a User**, I want to watch the agent think, pick tools, and observe results in real time so I have complete confidence in its behavior.
- **As a User**, I want to review and approve or reject any write action before external calendar events or database tasks are modified.
- **As a User**, I want to link my Google Calendar with one click or use Dev Quick Login for rapid offline/local testing.
- **As a User**, I want to view my live to-do list and an immutable audit trail of past agent invocations with performance metrics.

---

## Scope for the Frontend Build

### In Scope:
- **Vite + React 19 SPA:** Ultra-fast bundling, modern hook primitives, and lightning-fast HMR.
- **Tailwind CSS v3 Design System:** Modern dark aesthetics, slate/zinc palette (`#060911`, `#0b101d`), neon emerald brand accents (`#10b981`), glowing glassmorphic panels, and micro-animations.
- **Real-Time Dual Transport:**
  - REST client with automatic `credentials: 'include'` for HttpOnly JWT session persistence.
  - Socket.io client connecting to port 5001 with session room management (`join_conversation` / `leave_conversation`).
- **Interactive Component Suite:**
  - `Header`: Real-time health badge, active LLM indicator, Google Calendar connect status, dev login shortcut.
  - `GoalInput`: Prompt textarea with keyboard shortcuts (`Enter` to submit) and 4 interactive starter suggestion chips.
  - `ReasoningFeed`: Live stream visualizer for Reason, Act, and Observe steps, active spinner states, and final answer card.
  - `ConfirmationModal`: HITL modal with event/task parameter breakdown and Approve/Reject triggers.
  - `TaskPanel`: MongoDB task manager with status filters (`All`, `Pending`, `Completed`), inline creation, and completion toggles.
  - `AuditLogPanel`: Live streaming table with aggregated metrics (total calls, confirmed count, success rate) and expandable JSON viewers.
  - `SystemInfoModal`: Educational modal breaking down the hand-built ReAct loop architecture and tool schemas.

### Explicitly Out of Scope:
- Heavy component UI libraries (e.g. Material UI, Ant Design) — avoided in favor of Tailwind CSS for full aesthetic control.
- Complex third-party state managers (Redux, MobX) — scoped to lightweight React Context and custom hooks to eliminate boilerplate.
- File upload/attachment inputs — not required since tools are limited to Calendar and Task DB.
- Complex charting libraries — summary metric cards prove analytics without bloat.

---

## Tech Stack Summary

- **Framework:** React 19 (Vite 8)
- **Styling:** Tailwind CSS v3, PostCSS, Autoprefixer
- **Icons:** Lucide React
- **Real-Time Transport:** Socket.io-client
- **Typography:** Inter & JetBrains Mono (Google Fonts)
- **Target Deployment:** Vercel (SPA mode with rewrite rules)

---

## Related Documents

- See `architecture.md` for the detailed component hierarchy, state flow diagrams, WebSocket contract, and networking architecture.
- See `decision.md` for all Architectural Decision Records (ADRs) explaining technical trade-offs and rationale.
