# J.A.R.V.I.S. — Vision & Roadmap

**Just A Rather Very Intelligent System**

This is the single source of truth for what JARVIS is, why it exists, how it's built, and exactly what comes next. Every decision traces back to this document.

---

## 1. Why JARVIS Exists

We used OpenClaw.ai extensively and hit its ceiling. These aren't theoretical problems — they're daily frustrations:

| OpenClaw Problem | What Actually Happens |
|---|---|
| **Memory forgets** | Claims infinite memory but old conversations vanish. Ask about something from 2 weeks ago and it has no idea. |
| **Future tasks get lost** | "Remind me tomorrow" works sometimes. Schedule something for next week — gone. The in-memory queue dies on restart. |
| **Personality is flat** | Static SOUL.md file. Doesn't learn your preferences, doesn't adapt tone per channel, every conversation feels the same. |
| **GUI is bad** | The web interface is clunky and limited. No real dashboard, no way to see what the agent is doing or has learned. |
| **Browser control breaks** | Uses a relay extension that gets blocked by sites, can't access your actual logged-in sessions, requires manual setup. |
| **It sleeps between messages** | OpenClaw is a message relay — it only exists when you talk to it. No background observation, no proactive action between conversations. |
| **Single flat agent** | One agent does everything with no specialization. No delegation, no hierarchy, no concept of different responsibilities. |
| **"Be helpful" is the whole job description** | No measurable goals, no KPIs, no authority levels. Just a vague instruction to assist. |

JARVIS fixes every single one of these by being fundamentally different in architecture — not just a better chatbot, but a different category of software.

---

## 2. What Makes JARVIS Different

| Dimension | OpenClaw | J.A.R.V.I.S. |
|---|---|---|
| **Runtime** | Message relay (sleeps between messages) | Always-on daemon process |
| **Memory** | Flat markdown files | Structured knowledge graph (entities, facts, relationships) in SQLite |
| **Future tasks** | In-memory queue (lost on crash) | Persistent commitment engine with WAL journaling |
| **Personality** | Static SOUL.md | Adaptive personality engine that learns from every interaction |
| **Agent model** | Single agent does everything | Multi-agent hierarchy with roles (like a company org chart) |
| **Browser** | Extension relay (gets blocked) | Native CDP — connects to your actual Chrome sessions |
| **Desktop control** | Shell commands only | Full UI Automation (UIA on Windows, AXUIElement on macOS, AT-SPI2 on Linux) |
| **Role system** | "Be a helpful assistant" | Job descriptions with responsibilities, KPIs, authority levels, escalation rules |
| **Observation** | None — blind between messages | File watcher, clipboard monitor, process monitor, calendar/email sync |
| **Philosophy** | Safe and permission-seeking | Autonomous and proactive — so powerful it's risky to use |

The core insight: OpenClaw is a **chatbot with tools**. JARVIS is an **autonomous agent with a world model**.

---

## 3. Architecture

```
                    +-----------------------+
                    |     Web Dashboard     |  React UI
                    |   (port 3142/http)    |
                    +-----------+-----------+
                                |
                    +-----------+-----------+
                    |   Communication Layer |  WebSocket, Telegram, Discord,
                    |   (channels + voice)  |  WhatsApp, Signal, Voice
                    +-----------+-----------+
                                |
                    +-----------+-----------+
                    |      Daemon Core      |  Service registry, health monitor,
                    |   (always-on process) |  graceful shutdown, heartbeat
                    +-----------+-----------+
                         |      |      |
              +----------+  +---+---+  +----------+
              |             |       |             |
    +---------+---+  +-----+-----+ +---+---------+
    | Agent       |  | Personality|  | Observer   |
    | Orchestrator|  | Engine     |  | Manager    |
    | (brain)     |  | (soul)     |  | (eyes)     |
    +------+------+  +-----------+  +------+------+
           |                               |
    +------+------+                 +------+------+
    | Role Engine  |                 | File Watcher |
    | (job desc)   |                 | Clipboard    |
    +--------------+                 | Processes    |
           |                         | Calendar     |
    +------+------+                 | Email        |
    | LLM Manager  |                +-------------+
    | (providers)  |
    +------+------+
           |
    +------+------+                 +-------------+
    | Action Layer |<-------------->|   Vault      |
    | (hands)      |                | (memory)     |
    +--------------+                +-------------+
    | Browser/CDP  |                | Entities     |
    | Terminal/Bash |                | Facts        |
    | App Control   |                | Relationships|
    | Tool Registry |                | Commitments  |
    +--------------+                | Observations |
                                    | Vectors      |
                                    +-------------+
```

### Module Map (12 directories, 81 TypeScript files)

| Module | Directory | Purpose | Key Files |
|---|---|---|---|
| **Daemon** | `src/daemon/` | Process lifecycle, service orchestration | `index.ts`, `services.ts`, `health.ts` |
| **Agent Service** | `src/daemon/` | Wires brain to mouth and eyes | `agent-service.ts`, `ws-service.ts`, `observer-service.ts` |
| **Agents** | `src/agents/` | Agent instances, hierarchy, delegation, messaging | `agent.ts`, `orchestrator.ts`, `hierarchy.ts`, `delegation.ts` |
| **Roles** | `src/roles/` | YAML role definitions, prompt building, authority | `types.ts`, `loader.ts`, `prompt-builder.ts`, `authority.ts` |
| **LLM** | `src/llm/` | Provider abstraction (Anthropic, OpenAI, Ollama) | `provider.ts`, `manager.ts`, `anthropic.ts`, `openai.ts`, `ollama.ts` |
| **Vault** | `src/vault/` | SQLite knowledge graph, persistent memory, retrieval | `schema.ts`, `entities.ts`, `facts.ts`, `relationships.ts`, `commitments.ts`, `retrieval.ts`, `extractor.ts` |
| **Personality** | `src/personality/` | Adaptive personality, channel-specific, learning | `model.ts`, `learner.ts`, `adapter.ts` |
| **Actions** | `src/actions/` | Browser CDP, terminal, app control, tool registry | `browser/cdp.ts`, `terminal/executor.ts`, `tools/registry.ts` |
| **Observers** | `src/observers/` | File watcher, clipboard, process monitor | `file-watcher.ts`, `clipboard.ts`, `processes.ts` |
| **Comms** | `src/comms/` | WebSocket server, stream relay, channel adapters | `websocket.ts`, `streaming.ts`, `channels/*.ts` |
| **Config** | `src/config/` | YAML config loading, type-safe defaults | `loader.ts`, `types.ts` |
| **Role YAMLs** | `roles/` | 9 role definitions | `personal-assistant.yaml`, `ceo-founder.yaml`, etc. |

### Message Flow (how a chat request works today)

```
Client sends WebSocket message
  -> WSService.routeMessage()
    -> AgentService.streamMessage(text, channel)
      -> Retrieves vault knowledge: extractSearchTerms(text) -> query entities/facts/relationships
      -> Builds PromptContext: current time + vault knowledge + due commitments + recent observations
      -> Builds system prompt: role template + knowledge context + personality for this channel
      -> AgentOrchestrator.streamMessage() with tool execution loop (max 10 iterations)
    -> StreamRelay broadcasts token chunks + tool_call events to all WebSocket clients
    -> onComplete(fullText):
      -> Agent history updated (by orchestrator)
      -> [background] extractAndStore() -> entities/facts/relationships into vault
      -> [background] personality learning -> extractSignals + applySignals + savePersonality
```

### Data Flow (what the Vault stores)

```
User says "Remind me to call John tomorrow at 3pm about the project"
  -> extractAndStore() runs after LLM response:
    -> Entity: { name: "John", type: "person" }
    -> Commitment: { what: "call John about the project", when_due: tomorrow 3pm, priority: "medium" }
    -> Fact: { subject: "John", predicate: "involved_in", object: "the project" }

Next conversation, PromptContext includes:
  -> activeCommitments: "[medium] call John about the project (due: tomorrow 3:00 PM) — pending"
  -> Agent knows about this commitment without being told again
```

---

## 4. Current Status

**Last updated: Feb 24, 2026**

### What's Built and Working

| Component | Status | Details |
|---|---|---|
| Daemon lifecycle | DONE | Start, shutdown, signal handling, health monitor, heartbeat |
| Service registry | DONE | Ordered start/stop, status tracking |
| LLM providers | DONE | Anthropic, OpenAI, Ollama with fallback chain and streaming |
| Vault schema | DONE | 8 SQLite tables with WAL mode |
| Vault CRUD | DONE | Full CRUD for entities, facts, relationships, commitments, observations, vectors |
| Knowledge extractor | DONE | LLM-powered extraction of entities/facts/commitments from conversations |
| Role engine | DONE | YAML loader, prompt builder, authority system, 9 role templates |
| Agent framework | DONE | Agent instances, orchestrator, hierarchy, delegation, inter-agent messaging |
| Personality engine | DONE | Model storage, signal extraction, learning, channel-specific adaptation |
| Observer layer | DONE | Manager + 6 real observers (file, clipboard, process, email, calendar, notifications) |
| Communication layer | DONE | WebSocket server, stream relay, 4 channel adapter stubs |
| Daemon integration | DONE | AgentService + WSService + ObserverService all wired together |
| Config system | DONE | YAML loader with type-safe defaults and deep merge |
| Tool execution loop | DONE | Agentic loop: LLM → tool_calls → execute → feed back → repeat (max 10 iterations) |
| Built-in tools | DONE | run_command, read_file, write_file, list_directory — all wired to orchestrator |
| Tests | DONE | 143 tests passing across 13 files |

### Critical Gaps (What's Blocking a Usable System)

| Gap | Why It Matters | What Needs to Happen |
|---|---|---|
| ~~No memory retrieval in prompts~~ | **FIXED** (Milestone 3) | `retrieval.ts` queries vault per message, injects into system prompt |
| ~~No browser control~~ | **FIXED** (Milestone 4) | 5 browser tools via CDP: navigate, snapshot, click, type, screenshot |
| ~~No proactive behavior~~ | **FIXED** (Milestone 5) | CommitmentExecutor (notify-then-execute), Gmail/Calendar observers, D-Bus notifications, research queue |

### Stubs and Placeholders

- `src/comms/channels/telegram.ts` — stub (needs bot token)
- `src/comms/channels/whatsapp.ts` — stub (needs Baileys)
- `src/comms/channels/discord.ts` — stub (needs bot token)
- `src/comms/channels/signal.ts` — stub
- `src/comms/voice.ts` — stub (needs Whisper + TTS)
- `src/actions/app-control/windows.ts` — stub (needs UIA COM)
- `src/actions/app-control/macos.ts` — stub (needs AXUIElement)
- `src/actions/app-control/linux.ts` — partial (AT-SPI2 D-Bus)
- `src/vault/vectors.ts` — stub (needs sqlite-vec extension)

---

## 5. Roadmap

Milestones are ordered. Each one builds on the previous. No skipping.

---

### Milestone 1: First Working Conversation -- DONE (Feb 23, 2026)

**Goal**: Send a message via WebSocket and get a real LLM response with the agent's role personality.

**What was done**:
- Fixed `DEFAULT_CONFIG.active_role` from `'default'` to `'personal-assistant'`
- Fixed `config.example.yaml` (wrong port and active_role)
- Fixed `streaming.ts` bug (`event.usage` → `event.response.usage`)
- Fixed `observer-service.ts` (FileWatcher needed constructor args)
- Created `~/.jarvis/config.yaml` with Anthropic API key
- Verified: multi-turn conversation works, personality state persists, knowledge extraction stores entities/facts in vault

---

### Milestone 2: Tool Execution Loop -- DONE (Feb 23, 2026)

**Goal**: Agent can call tools (terminal commands, file operations) and the results feed back into the conversation automatically.

**What was done**:
- Extended `LLMMessage` type with `tool_calls?`, `tool_call_id?`, and `role: 'tool'` for tool result messages
- Updated `AnthropicProvider.convertMessages()` to handle tool_use and tool_result content blocks
- Created `src/actions/tools/builtin.ts` with 4 tools: `run_command`, `read_file`, `write_file`, `list_directory`
- Added `toolDefToLLMTool()` converter (ToolDefinition params → JSON Schema for LLM)
- Rewrote `AgentOrchestrator.streamMessage()` and `processMessage()` with full tool execution loop (max 10 iterations)
- Wired `ToolRegistry` creation and registration in `AgentService.start()`
- Updated `StreamRelay` to broadcast `tool_call` events to WebSocket clients
- Verified: multi-tool sequences work (write_file → read_file in one turn), run_command executes real shell commands, list_directory works

---

### Milestone 3: Memory That Works -- DONE

**Goal**: Agent remembers things across conversations. Knowledge extracted from past conversations appears in future prompts.

**Depends on**: Milestone 1

**Completed**: 2026-02-23. All 3 components working:
- Created `src/vault/retrieval.ts` — keyword-based vault query engine (extractSearchTerms → searchEntitiesByName + fact object/predicate search → formatKnowledgeContext)
- Added `knowledgeContext` field to `PromptContext` in `prompt-builder.ts`, rendered as "## Relevant Knowledge" section
- Modified `agent-service.ts`: `buildPromptContext(userMessage?)` now calls `getKnowledgeForMessage()` and injects vault knowledge into every system prompt
- `buildFullSystemPrompt(channel, userMessage)` passes user text through to retrieval
- 12 new unit tests for retrieval module (92 total, all passing)
- Verified: told JARVIS "My friend John works at Google. He lives in San Francisco." → restarted daemon (fresh conversation) → asked "Where does John work?" → answered "John works at Google" → asked "Where does John live?" → answered "John lives in San Francisco"
- Extraction pipeline confirmed working: entities (John, Google, San Francisco, user), facts (works_at, lives_in), relationships (friend_of) all stored correctly

---

### Milestone 4: Browser Control — DONE (Feb 23, 2026)

**Goal**: Agent can open a browser, navigate to pages, click elements, fill forms, and extract information. Zero user setup.

**Depends on**: Milestone 2 (needs tool execution loop)

**Completed**: 2026-02-23. All components implemented and verified end-to-end:
- Rewrote `src/actions/browser/cdp.ts` — proper CDP WebSocket client with event handling (command/response pairs + event subscriptions + waitForEvent)
- Rewrote `src/actions/browser/session.ts` as `BrowserController` — high-level: navigate (with Page.loadEventFired wait), snapshot (numbered interactive elements), click (Input.dispatchMouseEvent at element coords), type (Input.insertText + Ctrl+A clear), screenshot (Page.captureScreenshot → file), pressEnter
- Created `src/actions/browser/stealth.ts` — hides webdriver flag, fakes plugins/languages/chrome.runtime, patches permissions query
- Created `src/actions/browser/chrome-launcher.ts` — zero-setup auto-launch:
  - `findBrowserExecutable()` auto-detects Chrome/Brave/Edge/Chromium on Linux, macOS, Windows, WSL2
  - On WSL2: prefers Linux-native browser (shares network namespace, CDP works on 127.0.0.1) over Windows Chrome
  - `launchChrome(port)` spawns browser with isolated profile at `~/.jarvis/browser/profile`
  - `stopChrome(running)` graceful shutdown (SIGTERM → SIGKILL fallback)
  - Polls CDP endpoint for up to 15s after launch
- BrowserController.connect() auto-launches Chrome if not running — user never needs to configure anything
- BrowserController.disconnect() stops the auto-launched Chrome on daemon shutdown
- AgentService.stop() wires browser cleanup into daemon lifecycle
- Added 5 browser tools to `builtin.ts`: `browser_navigate`, `browser_snapshot`, `browser_click`, `browser_type`, `browser_screenshot`
- Snapshot approach: JS extracts all interactive elements (links, buttons, inputs) with bounding rects, assigns sequential IDs, LLM sees `[1] input name="q" placeholder="Search"` and references by ID
- Coordinates stored server-side (not sent to LLM), used for click/type dispatching
- 92 tests passing

**Verified end-to-end**: Asked JARVIS "Use browser_navigate to go to https://example.com" → Chromium auto-launched → CDP connected → navigated → snapshot extracted → JARVIS described the page content ("Example Domain" heading, body text, More Information link). Full flow: zero user setup.

---

### Milestone 5: Proactive Agent — DONE (Feb 24, 2026)

**Goal**: JARVIS acts on its own — executes commitments, responds to observations, monitors email/calendar, researches in idle time.

**Depends on**: Milestones 2, 3

**Completed**: 2026-02-24. Full proactive agent system implemented:

- **CommitmentExecutor** (`src/daemon/commitment-executor.ts`) — notify-then-execute engine:
  - Checks for due commitments every 60s
  - Announces pending execution to UI with cancel window
  - Auto-executes after cancel window expires (configurable aggressiveness: passive/moderate/aggressive)
  - Cancel flow via WebSocket command
  - Integrated into daemon lifecycle (start/stop/shutdown)

- **Google OAuth2** (`src/integrations/google-auth.ts`, `google-api.ts`) — zero-dep auth:
  - Raw `fetch()` against Google REST APIs (no googleapis package)
  - Token management with auto-refresh (5 min buffer)
  - Setup CLI: `bun run setup:google`
  - OAuth callback route at `/api/auth/google/callback`
  - Tokens stored at `~/.jarvis/google-tokens.json`

- **Gmail Observer** (`src/observers/email.ts`) — polls Gmail every 60s:
  - Tracks seen message IDs to avoid re-emitting
  - Fetches detail (subject, from, snippet, labels) for new messages
  - Enhanced email classification: IMPORTANT/STARRED labels → high priority, urgent keywords → high

- **Calendar Observer** (`src/observers/calendar.ts`) — polls Google Calendar every 2 min:
  - 30-minute look-ahead window
  - Tracks announced event IDs to avoid duplicate alerts
  - Events classified as high priority for immediate reaction

- **D-Bus Notification Observer** (`src/observers/notifications.ts`) — Linux/WSL2:
  - Spawns `dbus-monitor` watching org.freedesktop.Notifications
  - State machine parser for notification blocks (app, title, body, urgency)
  - Graceful: no-op if dbus-monitor not available

- **Research Queue** (`src/daemon/research-queue.ts`, `src/actions/tools/research.ts`):
  - In-memory queue (max 50 topics) with priority ordering
  - `research_queue` tool: add/list/remove actions
  - Heartbeat injects next research topic when idle
  - Topics from conversations, user requests, or agent curiosity

- **Enhanced heartbeat**: commitment execution instructions, background research injection, idle mode discovery

- 92 tests passing, zero new npm dependencies

---

### Milestone 6: Dashboard UI

**Goal**: React web interface showing conversations, agent status, knowledge graph, commitments, and personality state.

**Depends on**: Milestones 1-3

**What to do**:
1. Create React app served by Bun's HTML import system
2. Pages/views:
   - **Chat** — real-time conversation with streaming responses
   - **Status** — service health, connected clients, LLM usage
   - **Knowledge** — browse entities, facts, relationships in the vault
   - **Commitments** — view/edit upcoming commitments
   - **Personality** — see current personality state, trait values
   - **Agents** — org chart view of active agents (when multi-agent is built)
3. WebSocket connection for real-time updates and chat
4. Serve on the same port as WebSocket (3142)

**Files to create/modify**:
- `src/ui/index.html` (NEW) — entry point
- `src/ui/app.tsx` (NEW) — React root
- `src/ui/pages/*.tsx` (NEW) — page components
- `src/ui/components/*.tsx` (NEW) — shared components
- `src/daemon/index.ts` — serve static HTML alongside WebSocket

**Definition of done**: Open `http://localhost:3142` in a browser, see the dashboard, send a message, get a streamed response. View knowledge graph entries.

**Test**: Visual verification + WebSocket message flow works through the UI.

---

### Milestone 7: Multi-Agent Hierarchy — DONE (Feb 24, 2026)

**Goal**: Primary agent can spawn sub-agents with different roles, delegate tasks, and manage a team.

**Depends on**: Milestones 2, 3

**Completed**: 2026-02-24. Full multi-agent delegation system implemented:

- **`delegate_task` tool** (existing, enhanced) — sync one-shot delegation: spawns specialist, runs LLM+tool loop, returns result, terminates. Best for quick focused tasks.

- **`manage_agents` tool** (NEW, `src/actions/tools/agents.ts`) — persistent agent management:
  - `spawn` — create persistent sub-agent from 11 specialist roles (returns agent_id)
  - `assign` — send task to existing agent (async, runs in background, returns task_id)
  - `status` — check agent or task progress
  - `collect` — get full result of completed task
  - `list` — show all active agents and running tasks
  - `terminate` — shut down agent and children

- **AgentTaskManager** (NEW, `src/agents/task-manager.ts`) — background async runner:
  - Fires `runSubAgent()` as background Promises (no blocking)
  - Tracks task status: running → completed / failed
  - Enables parallel execution of multiple specialists simultaneously

- **Shared `createScopedToolRegistry()`** — extracted from delegate.ts to sub-agent-runner.ts for reuse

- **Enhanced system prompt** — delegation strategy guidance: when to use sync vs async delegation

- **API routes** — `GET /api/agents/tasks` for async task visibility

- 11 specialist roles available: research-analyst, software-engineer, content-writer, data-analyst, system-administrator, project-coordinator, financial-analyst, hr-specialist, marketing-strategist, legal-advisor, customer-support

- 92 tests passing, zero new npm dependencies

---

### Milestone 8: Communication Channels

**Goal**: Talk to JARVIS through Telegram, Discord, or WhatsApp — not just WebSocket.

**Depends on**: Milestones 1-3

**What to do**:
1. Implement Telegram adapter (grammyjs) — register bot, handle messages, stream responses
2. Implement Discord adapter (discord.js) — bot joins server, responds in channels
3. Implement WhatsApp adapter (Baileys) — connect to WhatsApp Web, handle messages
4. Personality adapts per channel (formal on Telegram, casual on Discord)
5. All channels route through the same AgentService — same brain, different mouths

**Files to create/modify**:
- `src/comms/channels/telegram.ts` — real implementation
- `src/comms/channels/discord.ts` — real implementation
- `src/comms/channels/whatsapp.ts` — real implementation
- `src/daemon/index.ts` — start channel services
- `package.json` — add dependencies (grammy, discord.js, baileys)

**Definition of done**: Send a Telegram message to JARVIS bot, get a response. Same JARVIS, same memory, different channel.

**Test**: Conversation through at least one external channel.

---

### Milestone 9: Native App Control ✅ DONE

**Goal**: JARVIS can control any desktop application — click buttons, fill forms, read screen content — not just browsers.

**Depends on**: Milestone 2

**What was built**:
1. **C# FlaUI Sidecar** (`sidecar/desktop-bridge/`): Self-contained .NET 10 Windows exe using FlaUI for UI Automation (UIA3). TCP JSON-RPC server on port 9224. Handles: window management, UI element tree walking, click/drag/type/press keys, screenshots, app launch/close.
2. **Sidecar Launcher** (`src/actions/app-control/sidecar-launcher.ts`): Auto-detects and launches desktop-bridge.exe from WSL. WSL2 networking support (mirrored + fallback to host IP from /etc/resolv.conf).
3. **DesktopController** (`src/actions/app-control/desktop-controller.ts`): TCP JSON-RPC client implementing AppController interface. Mirrors BrowserController pattern: lazy connect, auto-launch, snapshot with numbered `[id]`s, element cache.
4. **8 Desktop Tools**: `desktop_list_windows`, `desktop_snapshot`, `desktop_click`, `desktop_type`, `desktop_press_keys`, `desktop_launch_app`, `desktop_screenshot`, `desktop_focus_window`. Factory: `createDesktopTools(ctrl)`.
5. **Daemon Integration**: Desktop tools registered in BUILTIN_TOOLS and background agent. Sidecar cleanup on shutdown.
6. **Vision Support**: `ContentBlock` types (text + image), `ToolResult` for multi-modal tool returns, `guardImageSize` safety. Screenshot tools (`desktop_screenshot`, `browser_screenshot`) now send images directly to Claude Vision via base64 content blocks in tool results. The LLM can **see** screenshots and describe what's on screen.
7. **143 tests passing** across 13 files (28 new tests).

**Definition of done**: Ask JARVIS to "open Notepad and type 'Hello World'" and it does it on your Windows desktop from WSL.

**Test**: End-to-end app control task + unit tests for tools, controller, and launcher.

---

### Milestone 10: Voice Interface

**Goal**: Talk to JARVIS with your voice and hear responses spoken back.

**Depends on**: Milestones 1, 6

**What was done**:
1. STT: Already implemented (OpenAI/Groq/Local Whisper providers)
2. TTS: `edge-tts-universal` — free Microsoft Neural TTS, streaming sentence-by-sentence
3. Audio capture via `MediaRecorder` (WebM/Opus) + silence detection (`AnalyserNode`)
4. Binary WebSocket protocol: client binary = mic audio, server binary = TTS MP3 chunks
5. Wake word: `openwakeword-wasm-browser` with "Hey JARVIS" model (browser WASM)
6. Voice state machine hook (`useVoice.ts`): idle → wake_detected → recording → processing → speaking → idle
7. Dashboard mic button (PTT + wake word), voice status bar, TTS settings panel
8. Server voice pipeline: receive audio → STT transcribe → agent process → sentence split → TTS stream → binary send

**Key files**:
- `src/comms/voice.ts` — EdgeTTSProvider, createTTSProvider, splitIntoSentences
- `src/comms/websocket.ts` — binary WS dispatch, sendBinary, sendToClient, publicDir serving
- `src/daemon/ws-service.ts` — voice sessions, handleVoiceAudio, speakResponse
- `ui/src/hooks/useVoice.ts` — voice state machine, wake word engine, TTS playback queue
- `ui/src/hooks/useWebSocket.ts` — binary/voice message routing, voiceCallbacks
- `ui/src/components/chat/ChatInput.tsx` — mic button with visual states
- `ui/src/pages/ChatPage.tsx` — voice status bar, micPulse animation

**Definition of done**: Hold mic button or say "Hey JARVIS", speak a question, hear JARVIS respond with voice. ✅

---

## 6. Tech Stack & Conventions

| Technology | Purpose | Why |
|---|---|---|
| **Bun** | Runtime, bundler, test runner, package manager | Faster than Node, built-in SQLite, TypeScript native |
| **TypeScript (ESM)** | All source code | Type safety, modern imports |
| **SQLite (bun:sqlite)** | Knowledge graph, personality, commitments | Zero-config, WAL mode for concurrent access, embedded |
| **React** | Dashboard UI | Served via Bun's HTML imports, no Vite needed |
| **WebSocket** | Primary communication | Built into Bun.serve(), real-time streaming |
| **YAML** | Role definitions, config | Human-readable, easy to edit |
| **CDP (Chrome DevTools Protocol)** | Browser automation | Direct WebSocket to Chrome, no extensions |

### Conventions

- **No Node.js** — use `bun` for everything (`bun run`, `bun test`, `bun install`)
- **No Express** — use `Bun.serve()` with routes
- **No better-sqlite3** — use `bun:sqlite`
- **No Vite** — use Bun's HTML imports for frontend
- **No dotenv** — Bun loads `.env` automatically
- **Tests** — `bun test` with `import { test, expect } from "bun:test"`
- **Port 3142** — JARVIS default (pi digits, fitting for an AI)
- **Data dir** — `~/.jarvis/` for database, config, personality state

---

## Quick Reference: What To Work On Next

Look at the milestones in order. Find the first one that's not done. That's what you work on next.

| # | Milestone | Status |
|---|---|---|
| 1 | First Working Conversation | **DONE** |
| 2 | Tool Execution Loop | **DONE** |
| 3 | Memory That Works | **DONE** |
| 4 | Browser Control | **DONE** |
| 5 | Proactive Agent | **DONE** |
| 6 | Dashboard UI | **DONE** |
| 7 | Multi-Agent Hierarchy | **DONE** |
| 8 | Communication Channels | **DONE** |
| 9 | Native App Control | **DONE** |
| 10 | Voice Interface | **DONE** |

**Next action: Milestone 11 — Authority & Autonomy Engine.**
