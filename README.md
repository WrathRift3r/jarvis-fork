# JARVIS

**Just A Really Versatile Intelligent System**

> "The AI that doesn't ask permission." — Dangerously powerful by design.

JARVIS is an always-on autonomous AI daemon with a live world model. It is not a chatbot with tools. It is a proactive system that sees your desktop, thinks about what you're doing, and acts — within the authority limits you define.

---

## What Makes JARVIS Different

| Feature | ChatGPT Agent | JARVIS |
|---|---|---|
| Always-on | No — request/response only | Yes — persistent daemon |
| Desktop awareness | No | Yes — full capture every 5-10s |
| Native app control | No | Yes — Windows + Linux |
| Multi-agent delegation | No | Yes — 11 specialist roles |
| Visual workflow builder | No | Yes — 50+ nodes, n8n-style |
| Voice with wake word | No | Yes — streaming TTS + openwakeword |
| Goal pursuit (OKRs) | No | Yes — drill sergeant accountability |
| Authority gating | No | Yes — runtime enforcement + audit trail |

---

## Core Capabilities

**Conversations** — Multi-provider LLM routing (Anthropic Claude, OpenAI GPT, Ollama). Streaming responses, personality engine, vault-injected memory context on every message.

**Tool Execution** — 9 builtin tools with up to 25 iterations per turn. The agent loop runs until the task is complete, not until the response looks done.

**Memory & Knowledge** — Vault knowledge graph (entities, facts, relationships) stored in SQLite. Extracted automatically after each response. Injected into the system prompt so JARVIS always remembers what matters.

**Browser Control** — Auto-launches Chromium in stealth mode. CDP on port 9222. 5 browser tools. Handles navigation, interaction, extraction, and form filling.

**Desktop Automation** — C# FlaUI sidecar (`desktop-bridge.exe`) for Windows native app control from WSL. 8 desktop tools including clipboard, window management, and UI element interaction.

**Multi-Agent Hierarchy** — `delegate_task` and `manage_agents` tools. An AgentTaskManager coordinates 11 specialist roles. Sub-agents are denied governed actions — authority stays with the top-level agent.

**Voice Interface** — edge-tts TTS with streaming sentence-by-sentence playback. Binary WebSocket protocol carries mic audio (WebM) and TTS audio (MP3) on the same connection. Wake word via openwakeword (ONNX, runs in-browser).

**Continuous Awareness** — Full desktop capture at 5-10 second intervals. Hybrid OCR (Tesseract.js) + Cloud Vision. Struggle detection, activity session inference, entity-linked context graph. Proactive suggestions and an overlay widget.

**Workflow Automation** — Visual builder powered by `@xyflow/react`. 50+ nodes across 5 categories. Triggers: cron, webhook, file watch, screen events, polling, clipboard, process, git, email, calendar. NL chat creation, YAML export/import, retry + fallback + AI-powered self-heal.

**Goal Pursuit** — OKR hierarchy (objective → key result → daily action). Google-style 0.0–1.0 scoring. Morning planning, evening review, drill sergeant escalation. Awareness pipeline auto-advances progress. Three dashboard views: kanban, timeline, metrics.

**Authority & Autonomy** — Runtime enforcement with soft-gate approvals. Multi-channel approval delivery (chat, Telegram, Discord). Full audit trail. Emergency pause/kill controls. Consecutive-approval learning suggests auto-approve rules.

---

## Dashboard (13 Pages)

Built with React 19 and Tailwind CSS 4. Served by the daemon.

| Page | Purpose |
|---|---|
| Chat | Primary conversation interface with streaming |
| Tasks | Active commitments and background work queue |
| Content Pipeline | Multi-step content generation and review |
| Knowledge Graph | Visual vault explorer — entities, facts, relationships |
| Memory | Raw vault search and inspection |
| Calendar | Google Calendar integration with scheduling tools |
| Agent Office | Multi-agent delegation status and role management |
| Command Center | Tool history, execution logs, proactive notifications |
| Authority | Approval queue, permission rules, audit trail |
| Awareness | Live desktop feed, activity timeline, suggestions |
| Workflows | Visual builder, execution monitor, version history |
| Goals | OKR dashboard — kanban, timeline, and metrics views |
| Settings | API keys, integrations, behavior configuration |

---

## Quick Start

### One-liner install

```bash
curl -fsSL https://raw.githubusercontent.com/vierisid/jarvis/main/install.sh | bash
```

This installs the `jarvis` CLI, sets up systemd/launchd autostart, and runs the interactive configuration wizard.

### Manual setup

```bash
# Prerequisites: Bun >= 1.0
bun install
bun run setup
```

The `setup` command runs an interactive wizard that creates `~/.jarvis/config.yaml`.

### Run

```bash
jarvis          # Start the daemon (production)
bun run dev     # Start with hot reload (development)
```

The dashboard is available at `http://localhost:7777` once the daemon is running.

---

## Configuration

JARVIS stores its configuration at `~/.jarvis/config.yaml`. The only required field is the Anthropic API key.

```yaml
daemon:
  port: 7777
  data_dir: "~/.jarvis"
  db_path: "~/.jarvis/jarvis.db"

llm:
  primary: "anthropic"
  fallback: ["openai", "ollama"]
  anthropic:
    api_key: "sk-ant-..."
    model: "claude-opus-4-6"

personality:
  core_traits: ["loyal", "efficient", "proactive"]

authority:
  default_level: 3

active_role: "default"
```

See [config.example.yaml](config.example.yaml) for the full reference including Google OAuth, Telegram, Discord, and voice settings.

---

## Development

```bash
bun test                # Run all tests (377 tests across 22 files)
bun run dev             # Hot-reload daemon
bun run db:init         # Initialize or reset the database
```

### Stack

- **Runtime**: Bun (not Node.js)
- **Language**: TypeScript (ESM)
- **Database**: SQLite via `bun:sqlite`
- **UI**: React 19, Tailwind CSS 4, `@xyflow/react`
- **LLM**: Anthropic Claude (primary), OpenAI GPT, Ollama
- **Desktop sidecar**: C# + FlaUI (`desktop-bridge.exe`)
- **Voice**: openwakeword (ONNX), edge-tts-universal

---

## Development Status

### Completed Milestones

| # | Milestone | Summary |
|---|---|---|
| 1 | LLM Conversations | Multi-provider streaming, personality engine |
| 2 | Tool Execution Loop | 9 builtin tools, 25-iteration agent loop |
| 3 | Memory Retrieval | Vault knowledge graph injected per message |
| 4 | Browser Control | Chromium auto-launch, CDP, 5 browser tools |
| 5 | Proactive Agent | CommitmentExecutor, Gmail/Calendar observers, research queue |
| 6 | Dashboard UI | 13-page React 19 dashboard, Google integrations |
| 7 | Multi-Agent Hierarchy | `delegate_task`, AgentTaskManager, 11 specialist roles |
| 8 | Communication Channels | Telegram, Discord, pluggable STT, voice transcription |
| 9 | Native App Control | FlaUI sidecar, DesktopController, 8 desktop tools |
| 10 | Voice Interface | edge-tts, binary WS, wake word, streaming playback |
| 11 | Authority & Autonomy | Runtime enforcement, soft-gate approvals, audit trail, emergency controls |
| 12 | Distribution & Onboarding | `jarvis` CLI, install.sh, interactive wizard, systemd/launchd |
| 13 | Continuous Awareness | Desktop capture, OCR+Vision, proactive suggestions, overlay widget |
| 14 | Workflow Automation | Visual builder, 50+ nodes, NL creation, self-healing execution |
| 15 | Plugin Ecosystem | TypeScript SDK, tiered permissions, official plugin registry |
| 16 | Autonomous Goal Pursuit | OKR hierarchy, 0.0–1.0 scoring, daily rhythm, accountability |

**377 tests passing across 22 test files. ~30,000+ lines of TypeScript.**

### Upcoming

| # | Milestone |
|---|---|
| 17 | Smart Home — Home Assistant integration |
| 18 | Financial Intelligence — Plaid, portfolio tracking |
| 19 | Mobile Companion — React Native dashboard |
| 20 | Self-Improvement — Autonomous prompt evolution |
| 21 | Multi-Modal — DALL-E 3, full video/image processing |
| 22 | Swarm Intelligence — Multi-device coordination |

See [VISION.md](VISION.md) for the full roadmap with detailed specifications.

---

## Documentation

- [VISION.md](VISION.md) — Full roadmap and milestone specifications
- [docs/LLM_PROVIDERS.md](docs/LLM_PROVIDERS.md) — LLM provider configuration
- [docs/WORKFLOW_AUTOMATION.md](docs/WORKFLOW_AUTOMATION.md) — Workflow engine guide
- [docs/VAULT_EXTRACTOR.md](docs/VAULT_EXTRACTOR.md) — Memory and knowledge vault
- [docs/PERSONALITY_ENGINE.md](docs/PERSONALITY_ENGINE.md) — Personality and role system
- [config.example.yaml](config.example.yaml) — Full configuration reference

---

## Requirements

- **Bun** >= 1.0
- **OS**: macOS, Linux, or Windows (WSL2)
- **Anthropic API key** (required — powers the primary LLM)
- OpenAI API key (optional — fallback LLM)
- Ollama (optional — local model fallback)
- Google OAuth credentials (optional — Calendar and Gmail integration)
- Telegram bot token (optional — notification channel)
- Discord bot token (optional — notification channel)

For Windows desktop automation, `desktop-bridge.exe` is built automatically during setup. Requires .NET runtime on the Windows host.

---

## License

Private project — All rights reserved.
