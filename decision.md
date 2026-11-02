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

---

## ADR-C013: High-Contrast White Surface Theme & Header Telemetry Simplification

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  To achieve a crisp, high-signal professional aesthetic comparable to top-tier enterprise software (Stripe, Linear, Vercel), the interface required migrating to a high-contrast white canvas (#ffffff) with cool gray tonal surfaces (#f9fafb), crisp charcoal typography (#0f172a), and clean hairline borders (#e5e7eb). Concurrently, the user requested removing the LLM provider telemetry badge from the navigation bar to eliminate extraneous visual clutter.

- **Decision:**
  1. **White Surface Hierarchy:** Standardized on pure white (#ffffff) for primary workspaces, subtle cool gray (#f9fafb) for secondary ledger panes and parameter boxes, and crisp neutral gray (#e5e7eb) for hairline divider rules.
  2. **Header Telemetry Streamlining:** Removed the explicit LLM provider indicator from the top navigation bar, preserving only functional connection states (real-time stream health and calendar link status).
  3. **Monochromatic Primary Action:** Assigned solid charcoal (#0f172a) as the singular accent for the primary execution trigger ("Run goal") and confirmation actions, ensuring all secondary buttons remain calm and neutral.

- **Why Taken:**
  Creates an unmistakably custom, polished product appearance that eliminates generic dark-mode AI template tells while improving legibility and focus.

---

## ADR-C014: Same-Origin Development Proxy & Cross-Port Session Synchronization

- **Status:** Accepted
- **Date:** 2026-09-25
- **Context:**
  In local development, cross-port communication between the client (Port 5174) and server (Port 5001) triggered browser CORS preflight failures when accessed via host variations (e.g. 127.0.0.1 vs localhost) and caused Dev Login to fail. Additionally, slight response contract discrepancies between dev-login and the session inspection endpoint caused authentication state desynchronization.

- **Decision:**
  1. **Vite Development Proxy:** Configured vite.config.js to proxy /api and /socket.io directly to http://localhost:5001, allowing the client to execute same-origin HTTP and WebSocket calls.
  2. **First-Party Cookie Storage:** Same-origin routing ensures HttpOnly session cookies are accepted and sent without third-party cross-site cookie blocking.
  3. **Multi-Host Server Origin Normalization:** Updated backend CORS with a dynamic origin validator supporting any localhost or loopback port.
  4. **Session Contract Alignment:** Updated AuthContext to handle both authenticated and success response payloads, ensuring seamless session persistence upon login.

- **Why Taken:**
  Resolves dev-login failures deterministically across all browser security configurations and host addresses.

---

## ADR-C015: Direct WebSocket Transport Architecture & Elimination of Vite WS Proxy Choke

- **Status:** Accepted
- **Date:** 2026-09-26
- **Context:**
  Proxying WebSockets through Vite's development server (ws: true on /socket.io) caused "Error: write ECONNABORTED" socket exceptions whenever browser tabs reloaded, HMR triggered, or engine.io ping-pong intervals closed abruptly.

- **Decision:**
  1. **Direct Socket.io Connection:** Configured SocketContext.jsx to connect directly to the backend server (http://localhost:5001) using native cross-origin credentials, eliminating Vite's intermediate WebSocket proxy.
  2. **Dedicated HTTP REST Proxying:** Retained the Vite proxy exclusively for /api REST endpoints to maintain same-origin first-party cookie benefits while decoupling real-time transport from Vite's internal HMR server.

- **Why Taken:**
  Completely resolves write ECONNABORTED proxy crashes and guarantees resilient real-time streaming during page reloads and HMR updates.

---

## ADR-C016: Dynamic OAuth ReturnTo Origin Synchronization & Client URL Sanitization

- **Status:** Accepted
- **Date:** 2026-09-26
- **Context:**
  When authenticating through Google OAuth 2.0 while running on Port 5174, the backend redirected the browser back to a hardcoded Port 5173 destination. The frontend required passing its dynamic origin (`window.location.origin`) during OAuth initiation, receiving the redirect at Port 5174, immediately syncing the authenticated user session, and sanitizing the URL query string (`?auth=success`).

- **Decision:**
  1. **Dynamic Origin Parameterization:** Updated `authApi.getGoogleConnectUrl()` to append `?returnTo=${encodeURIComponent(window.location.origin)}`, ensuring the server preserves the active client origin across the OAuth flow.
  2. **Automated Session Hydration on OAuth Return:** Implemented an effect in `App.jsx` monitoring `window.location.search` for `?auth=success`, immediately triggering `refreshUser()` to populate the user profile and calendar link status.
  3. **Address Bar Sanitization:** Used `window.history.replaceState` to strip `?auth=success` and `?auth_error=...` from the browser address bar without forcing a page reload.
  4. **Dismissible Status Feedback:** Rendered non-intrusive notification banners for Google authentication events (success and error states) adhering to the clean white/light design system.

- **Why Taken:**
  Guarantees that Google OAuth redirects the user back to the exact port in use, auto-authenticates without requiring manual page refresh, and keeps the browser address bar clean.

---

## ADR-C017: ReAct Cycle Folding, Confirmation Extraction & Time Formatting Parity

- **Status:** Accepted
- **Date:** 2026-09-28
- **Context:**
  When streaming ReAct execution events, granular sub-step events (reasoning_start, tool_call, confirmation_required) created duplicate "Cycle 1" cards in the timeline feed. In addition, submitGoal attempted to read res.pendingAction instead of res.pendingConfirmation, causing the confirmation modal to fail to open when the ReAct loop paused for approval on create_calendar_event.

- **Decision:**
  1. **Cycle Event Folding Aggregator:** Updated useAgentSession.js to fold multiple granular WebSocket events for the same cycle number into a single, cohesive cycle node containing reasoning, tool details, approval status, and observation results.
  2. **Universal Confirmation Payload Normalization:** Updated useAgentSession.js to inspect res.pendingConfirmation || res.pendingAction || res.result?.pendingAction and extract confirmation IDs across both confirmationId and _id schemas.
  3. **Human-Readable Timestamp Formatting:** Enhanced ConfirmationModal.jsx to parse startTime, endTime, startDateTime, and endDateTime into localized, formatted date/time strings with dedicated clock icons.

- **Why Taken:**
  1. Eliminates noisy, duplicated step headers in the live execution feed.
  2. Guarantees that the Human-in-the-Loop confirmation modal immediately appears whenever write tools are triggered.
  3. Presents unambiguous start/end times during approval review.
---

## ADR-C018: Inner Timeline Viewport Isolation & Elimination of Window Auto-Scroll on Refresh

- **Status:** Accepted
- **Date:** 2026-10-27
- **Context:**
  When loading the application, refreshing the browser, or re-rendering after goal execution, the browser window uncontrollably scrolled down to the bottom of the page. This was traced to `endRef.current?.scrollIntoView({ behavior: 'smooth' })` inside `ReasoningFeed.jsx`, which forced the global window document viewport to scroll instead of constraining movement to the internal timeline container.

- **Decision:**
  1. **Container-Scoped Auto-Scroll:** Replaced `scrollIntoView()` with explicit `scrollContainerRef.current.scrollTo({ top: scrollContainerRef.current.scrollHeight, behavior: 'smooth' })` targeted strictly to the inner overflow container (`overflow-y-auto`).
  2. **Page Viewport Stability:** The outer page body, navigation bar, and operational side-panels maintain their exact scroll positions during refreshes and session restarts without disruptive jumping.

- **Why Taken:**
  Provides a stable, professional user experience where page refreshes and real-time log additions do not hijack the user's viewport.

---

## ADR-C019: 14-Day Audit Ledger Transparency & 30-Day Completed Task Retention Visibility

- **Status:** Accepted
- **Date:** 2026-10-27
- **Context:**
  To prevent unbounded database storage growth while providing complete operational accountability, the system adopted 14-day audit log retention and 30-day completed task expiration. The frontend required clear visual indicators of this lifecycle policy and transparent disclosure of all execution metadata (arguments, confirmation states, and tool results).

- **Decision:**
  1. **Audit Ledger Retention Header:** Added a prominent policy banner in `AuditLogPanel.jsx` stating that operational logs are retained for 14 days.
  2. **Expanded Audit Trace Inspection:** Enhanced log entry cards to display full execution context—including user approval status (`confirmedByUser`), input arguments, tool payload summaries, and failure diagnostics.
  3. **Completed Task TTL Status:** Added an indicator banner to `TaskPanel.jsx` displaying `"Completed tasks auto-archive & delete after 30 days"` with an active TTL badge, and contextual hover tooltips on completed task items.

- **Why Taken:**
  Ensures the user has total visibility into the data retention lifecycle and access to comprehensive audit trails without cluttering the active workflow.

---

## ADR-C020: Indian Date Standardization (DD-MM-YYYY, Short & Full Month) Across All Views and Inputs

- **Status:** Accepted
- **Date:** 2026-10-27
- **Context:**
  Default browser date formatting (`toLocaleDateString()`) produced US-centric Month-first formats (e.g. `10/23/2026` or `Oct 23, 2026`) that conflicted with the user's Indian locale requirements (`DD-MM-YYYY`, `23 Oct 2026`, or `23 October 2026`). Furthermore, browser `new Date()` failed on Indian numeric formats (`23-10-2026`) and defaulted text dates without years (e.g. `23 oct`) to year `2001`.

- **Decision:**
  1. **Client Date Utility (`src/utils/dateUtils.js`):** Implemented `parseIndianDate()` and `formatIndianDate()`:
     - Parses `DD-MM-YYYY`, `DD/MM/YYYY`, `DD.MM.YYYY`, and `DD-MM-YY` with optional time.
     - Parses both short and full month names (`23 oct`, `23 october`, `23 Oct 2026`, `23 October 2026`).
     - Automatically infers the current year (`2026`) when the user omits the year.
  2. **Universal Indian Formatting:** Formatted all rendered dates across `TaskPanel.jsx` (`Due 23 Oct 2026`, `Completed 23 Oct 2026`), `ReasoningFeed.jsx` (agent table cells and execution step timestamps), `AuditLogPanel.jsx` (log timestamps in 12-hour Indian time), and `ConfirmationModal.jsx` (event start/end times).
  3. **Direct Indian Date Input:** Added a dedicated Due Date text input to the task creation form in `TaskPanel.jsx` with placeholder `Due (e.g. 23-10-2026, 23 oct)` which parses through `parseIndianDate` prior to API dispatch.
  4. **Suggestion Chips Parity:** Updated prompt suggestion chips in `GoalInput.jsx` with Indian date syntax examples.

- **Why Taken:**
  Guarantees consistent, unambiguous Day-first Indian date presentation across all renders, refreshes, and modals while accepting both full and short month input forms.

---

## ADR-C021: Human-Centric Activity Feed Abstraction & Structured Meeting Cards

- **Status:** Accepted
- **Date:** 2026-11-01
- **Context:**
  The frontend previously displayed raw technical execution metrics—including cycle counters ("Cycle 1", "Cycle 2"), raw JSON tool arguments, observation dumps, and internal reasoning tags. This produced significant visual noise for normal users. The UI required clean, consumer-ready activity summaries and formatted meeting cards without modifying backend APIs or losing action audit log data.

- **Decision:**
  1. **Minimal Activity Summary:** Replaced cycle headers with compact status summaries (e.g. `3 actions completed`, `Checking calendar availability ✓`).
  2. **Collapsible Technical Steps:** Enclosed technical step inspection in a collapsible "View steps" drawer.
  3. **Structured Meeting Cards (`MeetingCard`):** Implemented visual cards in `ReasoningFeed.jsx` parsing key-value pairs (Title, Date, Time, Location, Participants, Meeting Link) with dedicated Lucide icons (`Calendar`, `Clock`, `MapPin`, `Users`, `ExternalLink`).
  4. **Markdown Artifact Cleanup:** Eliminated raw asterisks and markdown delimiters from rendered inline text.

- **Why Taken:**
  Transforms the interface into a professional, consumer-grade AI product while preserving full technical details in the Action Audit Log for power users.

---

## ADR-C022: Persistent Session and Conversation ID Decoupling (`localStorage` & Socket Reconnection)

- **Status:** Accepted
- **Date:** 2026-11-01
- **Context:**
  Browser refreshes caused the application to generate new Session and Conversation IDs, wiping active chat state and triggering duplicate socket room joining. Furthermore, clicking the Reset button unintentionally cleared the user's Session ID.

- **Decision:**
  1. **Decoupled Identity Lifecycle:**
     - `sessionId`: Persisted in `localStorage` across page refreshes and resets.
     - `conversationId`: Restored from `localStorage` on page refresh, and re-generated only on explicit Reset.
  2. **Socket Handshake Auth Synchronization:** Updated `SocketContext.jsx` and `useAgentSession.js` to pass `conversationId` and `sessionId` directly in Socket.io connection credentials, preventing room fragmentation and duplicate socket instances.

- **Why Taken:**
  Provides robust session continuity across browser reloads while preventing socket connection leaks and orphaned conversation rooms.

---

## ADR-C023: Timezone-Safe Date and Weekday Synchronization with Backend (`Asia/Kolkata`)

- **Status:** Accepted
- **Date:** 2026-11-02
- **Context:**
  Client-side date formatting previously relied on standard browser `toLocaleDateString()`, causing dates to shift when users accessed the app from different browser timezones or during edge hours near midnight. Additionally, weekday calculations required dynamic synchronization with the backend's `Asia/Kolkata` standard.

- **Decision:**
  1. **Enforced Asia/Kolkata Standard:** Updated `dateUtils.js` with `createISTDate`, `getISTDateParts`, `formatISTWeekday`, and explicit `{ timeZone: 'Asia/Kolkata' }` options.
  2. **Full-Format Weekday Parity:** Formatted `'full'` dates to include the long weekday name (e.g. `"Wednesday, 4 November 2026"`), guaranteeing complete alignment between frontend displays and backend calendar payloads.

- **Why Taken:**
  Ensures zero timezone drift between client browser rendering and backend calendar operations.

---

## ADR-C024: Action Audit Log UI Enhancement — Multi-Filter Controls, Structured Activity Details & Developer Inspection Drawer

- **Status:** Accepted
- **Date:** 2026-11-02
- **Context:**
  The Action Audit Log previously displayed raw JSON dumps when users expanded an audit entry. Normal users found it difficult to quickly scan task titles, due dates, priorities, or calendar details, while developers still required full JSON payloads, execution durations, and tool arguments for debugging. Furthermore, filtering through high volumes of audit records was unsupported.

- **Decision:**
  1. **Compact Multi-Filter Control Bar:**
     - Added three composable filter controls: Category (`All Actions`, `Calendar`, `Tasks`), Execution Status (`All Statuses`, `Successful`, `Failed`, `Pending`), and Specific Action (`All Actions`, `Task Created`, `Task Completed`, `Calendar Event Created`, `Calendar Availability Checked`).
     - Implemented immediate client-side filtering with a live matching record counter, empty-state reset button, and "Clear Filters" action.
  2. **10-Record Default Pagination:**
     - Initially displays the latest 10 records with a progressive "Show 10 more" / "Show all" pagination control to optimize DOM performance.
  3. **Structured Human-Readable Activity Details:**
     - Replaced raw JSON expansion with domain-specific cards:
       - `create_task`: Task title, priority badge, due date formatted in IST, status badge, and optional description notes.
       - `complete_task`: Completed task title, completion status, and execution timestamp.
       - `create_calendar_event`: Event title, date, start/end time in IST, location, attendee chips, and verified Google Meet link.
       - `check_calendar_availability`: Queried window, event count, and conflict status.
       - Safe fallback to `"Task details unavailable"` when titles are missing.
  4. **Collapsed-by-Default Developer Details Drawer:**
     - Embedded a nested accordion ("Developer Details") containing original tool names, Task/Event IDs, execution durations, error callouts, and formatted JSON viewer blocks (`<pre>`).
  5. **Secure Google Meet Link Extraction & One-Click Copy:**
     - Extracted validated URLs matching `https://meet.google.com/`, rendering a prominent external launch button and a 2-second visual feedback "Copy Link" control.

- **Why Taken:**
  Delivers a modern, consumer-grade experience for business users while preserving 100% of the raw diagnostic data required by software engineers.

---

## ADR-C025: Ground-Truth Scheduling Conflict Evaluation & False-Positive Elimination

- **Status:** Accepted
- **Date:** 2026-11-02
- **Context:**
  The assistant response UI previously determined scheduling conflict badges through naive substring regex matching (`/conflict|overlap|already scheduled/i`). When the assistant answered that *"no events are scheduled during the requested time window and there are no conflicts, the time slot is completely free"*, the regex triggered on the substring `"conflict"` inside `"no conflicts"`, incorrectly rendering an amber "Scheduling Conflict" badge.

- **Decision:**
  1. **Ground-Truth Tool Observation Precedence:** Updated `ReasoningFeed.jsx` (`getSchedulingConflictStatus`) to inspect the actual execution observation payload from the active conversation's `steps`. When `check_calendar_availability` returns `{ hasConflicts: false, isAvailable: true }` or `create_calendar_event` returns `{ success: true }`, conflict status is strictly `false`.
  2. **Explicit Negative/Clear Indicators:** Added pattern checks for explicit free-slot phrasing (`no conflicts`, `no overlap`, `no events are scheduled`, `slot is completely free`, `schedule is clear`) that immediately bypass conflict assertion.
  3. **Stale Multi-Step State Isolation:** Evaluates only the latest calendar observation of the active conversation, preventing historical conflicts from earlier dialogue turns from polluting the current view.

- **Why Taken:**
  Guarantees 100% semantic alignment between the visual badge indicators and the actual backend availability observation.

---

## ADR-C026: Action Audit Log Expanded UI Simplification & Action Filter Refinement

- **Status:** Accepted
- **Date:** 2026-11-02
- **Context:**
  After releasing the initial audit log filter in ADR-C024, user feedback requested:
  1. Completely removing visible Developer Details (raw JSON arguments and responses) from the expanded row in favor of a clean, human-readable card layout.
  2. Refining the Action filter to focus exclusively on auditable write actions (`create_task`, `complete_task`, `create_calendar_event`) by removing read-only availability queries from the Action dropdown.

- **Decision:**
  1. **Removed Developer Details Accordion:** Completely excised `<pre>` JSON blocks and technical error traces from the expanded row, rendering only domain-specific Activity Details (event title, date & weekday, start/end IST times, location, participant chips, Google Meet link, execution timestamp and latency).
  2. **Refined Action Filter Options:** Kept `All Actions`, `Task Created`, `Task Completed`, and `Calendar Event Created`, removing ephemeral read actions from the dropdown.
  3. **Bidirectional Category-Action Synchronization:** Selecting `Calendar Event Created` automatically aligns Category to `Calendar`, and selecting `Task` actions auto-aligns Category to `Tasks`, preventing impossible filter deadlocks.

- **Why Taken:**
  Transforms the expanded audit trail into a clean, consumer-grade activity ledger while maintaining strict filtering harmony.

---

## Key Frontend Engineering Highlights & Resume Impact (Ready-to-Use Resume Points)

1. **Real-Time Agent UI & Execution Stream Rendering:**
   > *Built a high-performance React 19 single-page application integrating Tailwind CSS v3 and Socket.io, designing a live activity stream that abstracts complex multi-cycle ReAct executions into human-readable task summaries and structured meeting cards with sub-100ms UI responsiveness.*

2. **Resilient Session Persistence & Connection Pool Architecture:**
   > *Architected an identity management and connection pooling system decoupling long-lived Session IDs from dialogue Conversation IDs using `localStorage` and Socket.io auth payloads, eliminating duplicate connection storms under React StrictMode and maintaining conversation state across page refreshes.*

3. **Timezone-Resilient Internationalized Date Presentation:**
   > *Implemented a comprehensive date parsing and formatting utility suite in React supporting Indian locale standards (`DD-MM-YYYY`, text formats, relative dates), enforcing `Asia/Kolkata` timezone parity across all modals, audit tables, and calendar event detail cards to eliminate cross-timezone drift.*

4. **Multi-Dimensional Audit Trail & Developer Inspection UX:**
   > *Designed an enterprise-grade Action Audit Log interface in React 19 featuring composable multi-criteria filtering (category, execution state, tool type), domain-specific activity cards, one-click Google Meet actions, and a collapsed-by-default developer telemetry drawer with formatted JSON inspectors.*

5. **Ground-Truth State Verification & False-Positive Elimination:**
   > *Engineered a multi-tier state verification engine in React 19 correlating LLM conversational output with real-time ReAct tool execution observation payloads, eliminating false-positive scheduling conflict badges by cross-referencing availability API ground truth and negative-assertion linguistic patterns.*
