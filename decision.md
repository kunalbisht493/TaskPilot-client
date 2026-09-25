# TaskPilot Client — Architectural Decision Records (ADRs)

This document records all significant technical and design decisions made for the TaskPilot React frontend.

---

## ADR-C001: Technology Stack — Vite + React 19 SPA vs Next.js vs CRA

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  TaskPilot requires a fast, responsive frontend to visualize live agentic workflows. We needed to choose an application framework that provides instant hot-module replacement (HMR), minimal bundle overhead, native WebSocket support, and effortless single-page deployment on Vercel.

- **Decision:**
  Adopt **Vite 8 + React 19** as a Single-Page Application (SPA).

- **Why Taken:**
  1. **Instant Developer Feedback:** Vite offers sub-second cold starts and rapid module updates compared to legacy webpack or heavyweight Next.js dev servers.
  2. **Zero SSR Overhead for WebSocket-Centric App:** The core feature is real-time client-side WebSocket streaming and stateful session memory; server-side rendering (SSR) adds complexity with zero performance benefit for this use case.
  3. **Clean Vercel Deployment:** Compiles to static assets (`dist/`) that deploy globally to Vercel edge CDN with zero serverless cold starts.

- **Alternatives Considered:**
  1. *Next.js (App Router):* Overkill for a single-page agent dashboard; complicates WebSocket state and HttpOnly cookie pass-through during SSR.
  2. *Create React App (CRA):* Deprecated, slow webpack builds, and outdated toolchains.

---

## ADR-C002: Styling Architecture — Tailwind CSS v3 vs Component Libraries

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The frontend must deliver a state-of-the-art visual aesthetic with sleek dark modes, subtle glassmorphism, animated pulse indicators, and responsive panel layouts without boilerplate bloat.

- **Decision:**
  Implement **Tailwind CSS v3** supplemented with custom utility classes (`.glass-panel`, `.glass-panel-elevated`) and **Lucide React** icons.

- **Why Taken:**
  1. **Aesthetic Precision:** Complete control over color tailoring (dark slate backgrounds, emerald brand highlights, amber warning cards) without fighting library default themes.
  2. **Minimal Bundle Size:** Purges unused CSS classes during production build, resulting in a 24 KB total stylesheet.
  3. **High Architectural Alignment:** Directly fulfills the technical specifications in Section 5 of `architecture.md`.

- **Alternatives Considered:**
  1. *Material UI (MUI) / Ant Design:* Heavy bundle footprints (~300 KB+), generic enterprise look that dilutes the agentic AI aesthetic.
  2. *Vanilla CSS Only:* Highly flexible but slower to write and harder to maintain responsive grids and micro-interactions solo.

---

## ADR-C003: Dual-Transport Integration Pattern (REST + Socket.io-client)

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The client must perform synchronous request-response actions (login, goal initiation, confirmations, task CRUD) while simultaneously receiving asynchronous streaming events (reasoning thoughts, tool invocations, audit log broadcasts).

- **Decision:**
  Implement a **Dual-Transport Pattern**:
  1. **HTTP/REST Transport (`src/api/client.js`):** Handles command-like mutations (`POST /api/agent/task`, `POST /api/agent/confirm`, task CRUD).
  2. **WebSocket Transport (`src/context/SocketContext.jsx`):** Maintains a persistent bidirectional socket with Port 5001, dynamically subscribing to conversation rooms (`join_conversation`) to stream `agent:step` and `agent:confirm_request` events.

- **Why Taken:**
  1. **Deterministic Request Lifecycle:** Avoids routing complex HTTP authentication and file-like mutations entirely over WebSockets.
  2. **Zero-Latency Stream:** Eliminates HTTP polling for agent reasoning steps and newly dispatched audit logs.
  3. **Resilience:** If the WebSocket briefly reconnects, REST endpoints remain operational, and session state is preserved on the server.

---

## ADR-C004: Explicit ReAct Loop Decomposition in UI (Reason → Act → Observe)

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  Traditional conversational AI interfaces display only a spinner followed by a final text paragraph, hiding the agent's multi-step tool execution logic. To demonstrate genuine agentic AI engineering, the UI must reveal the loop mechanics.

- **Decision:**
  Build a dedicated `ReasoningFeed` component that decomposes each step into:
  1. 🧠 **REASON:** The LLM's thought process, sub-goal reasoning, and next-action rationale (highlighted in indigo).
  2. ⚡ **ACT:** Structured tool execution request with argument schema formatting and write-guardrail badge (highlighted in amber).
  3. 👁️ **OBSERVE:** Real output received from external APIs or internal services (highlighted in emerald).
  4. Final synthesized response card upon goal completion.

- **Why Taken:**
  1. **High Portfolio & Interview Signal:** Demonstrates transparent AI engineering and proves the existence of a true ReAct loop rather than a mock chat prompt.
  2. **Trust & Observability:** Users see exactly why the agent chose a tool and what data was retrieved before an action occurs.

---

## ADR-C005: Modal-Based Human-in-the-Loop (HITL) Interception Pattern

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  When the backend pauses execution on write actions (`create_calendar_event`, `create_task`, `complete_task`), the UI must immediately capture the user's attention, present the proposed mutation clearly, and provide simple Approve or Reject controls.

- **Decision:**
  Implement `ConfirmationModal.jsx` which activates whenever `pendingConfirmation` is received over Socket.io or returned by the task endpoint.
  - Displays tool name, targeted parameters (calendar event time, description, or task title), and a safety advisory.
  - Renders **Approve & Execute** (calls `POST /api/agent/confirm` with `approved: true`) and **Reject / Cancel** (calls with `approved: false`).

- **Why Taken:**
  1. **Fail-Safe UI:** Prevents background execution while ensuring the user understands what mutation is pending.
  2. **Bifurcated User Control:** Allows the user to reject unwanted hallucinations without crashing the conversation; the LLM receives the cancellation observation and can apologize or suggest alternatives.

---

## ADR-C006: Context-Based Global State Architecture

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The frontend requires sharing user session state, backend health metrics, and socket connectivity across multiple components without introducing unnecessary boilerplate.

- **Decision:**
  Use native React Contexts:
  - `AuthContext`: User profile, authentication state, Google Calendar link status, Dev Login.
  - `SocketContext`: Persistent socket instance, connection status.
  - `useAgentSession`: Encapsulated hook managing active conversation state, steps, and pending confirmations.

- **Why Taken:**
  1. **Zero External Dependencies:** Eliminates Redux Toolkit or Zustand packages for a scoped application.
  2. **Simple Testing & Maintenance:** Easy to inspect and debug with standard React DevTools.

---

## ADR-C007: HttpOnly Cookie Transport with `credentials: 'include'`

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The backend issues JWT session tokens inside `HttpOnly`, `SameSite=Lax` cookies. The client needs to authenticate all API requests without exposing tokens to `localStorage`.

- **Decision:**
  Configure the centralized fetch wrapper in `src/api/client.js` with `credentials: 'include'` on all requests.

- **Why Taken:**
  1. **Maximum XSS Protection:** Prevents malicious client-side scripts from reading tokens from storage.
  2. **Seamless Browser Cookie Lifecycle:** Automatically attaches cookies across all origin-compliant requests.

---

## ADR-C008: Real-Time Audit Log Insertion via WebSocket Events

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The Action Audit Trail must reflect newly executed tools immediately without forcing users to click "Refresh" or running periodic background interval polling.

- **Decision:**
  In `AuditLogPanel.jsx`, listen directly to the `audit:new_log` WebSocket event. When a new log arrives, prepend it to the top of the table in memory and update the total action count.

- **Why Taken:**
  1. **Instant Observability:** Users see the audit entry appear the moment an action is executed.
  2. **Zero Server Polling Load:** Completely eliminates periodic `GET /api/audit-logs` HTTP polling overhead.

---

## ADR-C009: Quick Dev-Login Bypass for Accelerated Evaluation

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  During portfolio reviews and local development, setting up and authenticating real Google OAuth credentials can be cumbersome or blocked by redirect URI restrictions.

- **Decision:**
  Implement a prominent "Dev Quick Login" button calling `POST /api/auth/dev-login` alongside the standard Google OAuth connect button.

- **Why Taken:**
  1. **Instant Reviewer Accessibility:** Enables hiring managers and interviewers to run and test the complete agent loop in 1 click without OAuth setup.
  2. **Seamless Dual Mode:** Users with valid Google credentials can still click "Connect Calendar" to link real Google Calendar instances.

---

## ADR-C010: Vercel Single-Page Application (SPA) Deployment Strategy

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  The client will be deployed to Vercel independently from the backend (which deploys to Render). The client needs proper environment variable wiring and SPA routing rewrite rules.

- **Decision:**
  1. Use `import.meta.env.VITE_API_URL` with fallback to `http://localhost:5001`.
  2. Maintain `.env` and `.env.example` in the client root.
  3. Pre-configure clean production builds (`npm run build` outputting to `dist/`).

- **Why Taken:**
  1. **Separation of Concerns:** Client and Server can scale, deploy, and redeploy independently.
  2. **Zero Configuration for Vercel:** Vite's standard output is automatically recognized by Vercel.

---

## ADR-C011: Design System Refactoring, Client Security Hardening & Port 5174 Migration

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  To ensure visual credibility and eliminate generic AI demo aesthetics, the client required a design overhaul removing decorative gradients, neon glows, and scattered animations. Concurrently, client-side security needed hardening (enforcing input length boundaries, strict JSX escaping, zero token exposure, and cross-origin synchronization with port 5174).

- **Decision:**
  1. **Color & Surface System:** Replaced high-saturation neon accents and gradient washes with a calm, high-contrast dark slate palette (#0a0f1d, #0f172a, #161f30) and a singular slate-blue accent (#2563eb), reserving subtle amber (#b45309) strictly for pending human confirmation.
  2. **Structural UI Differentiation:** Replaced generic rounded cards with distinct, functional surfaces: a semantic <table> for the audit trail, an activity timeline for the reasoning feed, and a flat modal dialog for write-action confirmation.
  3. **Motion Restraint:** Eliminated ambient card hover-lifts and section fade-ins. Retained motion in exactly one deliberate place: the arrival of new reasoning steps (stepIn: 0.18s ease-out), fully supporting prefers-reduced-motion.
  4. **Input Defense & Rate Guard:** Enforced a client-side boundary (maxLength=500) with live character counting and submission disabling on the prompt input.
  5. **Port & CORS Alignment:** Reconfigured Vite to serve on port 5174, updating Express and Socket.io CORS origin whitelists to permit seamless cross-origin cookie and WebSocket communication.

- **Why Taken:**
  Delivers a calm, professional product appearance suitable for technical evaluation while enforcing defense-in-depth security principles.

---

## ADR-C012: De-homogenized Two-Pane Layout, Single-Accent Discipline & Execution Trace Timeline

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  Earlier builds exhibited repetitive box-in-box card treatments with uniform borders and blue accents applied across all buttons, tabs, and chrome. The user required eliminating this generic templated look in favor of distinct, purposeful surfaces, an authentic timeline trace feed, and strict single-accent discipline.

- **Decision:**
  1. **Structural Tonal Separation:** Eliminated floating cards with identical borders. Adopted an integrated two-pane split workspace (Execution Trace on #111215 canvas, Operations Ledger on #16181c subtle contrast) divided by a clean vertical guide line.
  2. **Single-Accent Constraint:** Reserved the primary action accent (#2563eb) strictly for the primary execution trigger ("Run goal"). Rendered all secondary buttons, tabs, and status badges in neutral zinc/slate tones.
  3. **Timeline Execution Spine:** Redesigned the Reasoning Feed into a continuous activity trace with vertical guide lines, cycle node markers (01, 02), inline command-style tool calls ($ call tool_name), and compact monospace observation blocks.
  4. **Operational Checklist & Semantic Log Table:** Formatted the Task Panel as an authentic checklist with hairline dividers and the Audit Log as a compact data table with column headers.
  5. **Specific Operational Empty States:** Replaced generic filler text with clear functional readiness summaries explaining data persistence and live streaming behavior.

- **Why Taken:**
  Elevates visual credibility to match top-tier engineering tools (Linear, Datadog, GitHub Actions) and proves custom product design rather than an AI-generated template.
