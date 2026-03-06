# JARVIS Platform — Monetization Strategy

> Open-source core, app platform on top. JARVIS is free forever. The Platform lets anyone build, deploy, and sell AI-powered SaaS products using JARVIS as the invisible engine. Revenue split on every transaction.

---

## The Big Idea

JARVIS is not a chatbot. It's a full runtime — with state, memory, automation, desktop control, voice, vision, and agency. That makes it infrastructure, not a feature.

The play: let people build entire businesses on top of JARVIS and sell them to end-users who never need to know JARVIS exists underneath. We take a cut of every transaction.

This is the Shopify model applied to AI. ChatGPT created thousands of thin wrapper startups. JARVIS lets people build thick, defensible products because the underlying platform can actually do things — control desktops, run workflows, remember context, make phone calls, write code, react to the real world.

---

## Two-Layer Strategy

### Layer 1: Preset Marketplace (Launch)

Pre-configured JARVIS personas — bundles of system prompts, workflows, knowledge bases, dashboard layouts, and onboarding scripts. Each passes the "20+ hours to DIY" quality bar. Users install a preset and get an expert-configured JARVIS for their use case.

**Target:** Individual JARVIS users who want instant value without configuring everything themselves.

### Layer 2: App Platform (Evolution)

Full SaaS products built on JARVIS, deployed to end-users who subscribe to the product, not to JARVIS. Builders create apps (receptionist SaaS, payment system generator, research-as-a-service), list them on the JARVIS Store, and collect subscription revenue. JARVIS takes a platform cut.

**Target:** Entrepreneurs, agencies, and companies building AI-powered products.

### The Bridge

Presets and apps share the same format — a preset is just an app where the builder and user are the same person. The manifest grows new fields (`type: app`, multi-tenancy config, custom UI, billing), but the foundation is identical. Ship presets first, evolve to apps.

---

## Target Audience

### Layer 1 — Preset Buyers

| ICP | Profile | What they buy |
|-----|---------|---------------|
| **Solo founders** | Building + selling + managing alone. Need leverage, not headcount. | Executive Assistant, Sales, Developer |
| **Developers** | Terminal-native, tool-obsessed, will stress-test everything. | Developer, Deep Work, Research |
| **Tech enthusiasts** | Power users who want the most capable local AI setup possible. | All Access — they want everything |

### Layer 2 — App Builders

| ICP | Profile | What they build |
|-----|---------|-----------------|
| **Solo entrepreneurs** | See an opportunity, want to ship fast without building from scratch | Vertical SaaS (receptionist, tutor, coach) |
| **Agencies** | Build AI solutions for clients, need a repeatable platform | Custom client deployments, white-labeled |
| **SaaS companies** | Have existing products, want to add AI capabilities or auto-generate verticals | Platform extensions (e.g., payment system vertical generator) |
| **Domain experts** | Deep knowledge in a field, no engineering team | Productized expertise (legal review, medical triage, financial analysis) |

---

## Real-World Examples

### Example 1: AI Receptionist SaaS
A builder configures JARVIS with voice + phone integration + scheduling workflows + a domain-specific role for dental offices. They package it as "DentAI Receptionist", list it at $99/mo per office. End-customers (dentists) subscribe, get a phone number that answers calls, books appointments, handles cancellations. They never see JARVIS. The builder collects $99/mo per customer, JARVIS takes 20%.

### Example 2: Payment Vertical Generator
A payment processing company uses JARVIS's coding + understanding capabilities to auto-generate entire vertical-specific payment ecosystems. When a new merchant signs up for "cannabis dispensary payments", JARVIS understands the regulatory requirements, compliance needs, and UX patterns for that vertical, then generates the entire ecosystem. The company sells this as their SaaS. JARVIS takes a platform cut.

### Example 3: Research-as-a-Service
A market research consultant packages their methodology into a JARVIS app — multi-source research, cross-referencing, report generation, client portal. Lists it at $49/mo. Small businesses subscribe for automated competitive intelligence. The consultant's expertise is productized and scales without their time.

### Example 4: AI Coding Tutor
A developer educator builds an interactive coding tutor using JARVIS's code execution, awareness (watches the student's screen), and voice capabilities. Students subscribe at $29/mo. The tutor adapts to each student's level, reviews their code in real-time, and provides Socratic guidance.

---

## What's Inside a Preset / App

Each preset/app is a `.jarvis-preset` bundle (tar.gz) containing:

| Component | File | Purpose |
|-----------|------|---------|
| Manifest | `manifest.json` | ID, version, type (preset/app), min daemon version, dependencies, billing config, changelog |
| Personality | `role.yaml` | System prompt, behavior rules, communication style, topic focus |
| Workflows | `workflows/*.yaml` | Pre-built automation chains (M14 format) |
| Knowledge Seeds | `vault/seeds/` | Pre-populated domain knowledge |
| Plugin Dependencies | `plugins.yaml` | Required/optional plugins |
| Dashboard Layout | `layout.json` | Widget positions, data sources, panel configuration |
| Notifications | `notifications.yaml` | Scheduled reminders and alert rules |
| Authority Rules | `authority.yaml` | Pre-configured approval/auto-approve settings |
| UI Theme | `theme.json` | Color accent, typography (subtle persona branding) |
| Onboarding Script | `onboarding.yaml` | Guided setup that collects persona-specific info |
| Custom UI | `ui/` | *(Apps only)* React frontend that talks to JARVIS APIs |
| Tenant Config | `tenancy.yaml` | *(Apps only)* Multi-tenant isolation rules, per-user data boundaries |
| API Routes | `api/` | *(Apps only)* Custom API endpoints exposed to end-users |

### Directory Structure

```
receptionist-saas-v1.0.0/
  manifest.json          # type: "app", billing, min version
  role.yaml
  workflows/
  vault/
    seeds/
    templates/
  plugins.yaml
  layout.json
  notifications.yaml
  authority.yaml
  theme.json
  onboarding.yaml
  ui/                    # custom branded frontend (apps only)
    index.html
    components/
    styles/
  api/                   # custom endpoints (apps only)
    routes.yaml
  tenancy.yaml           # multi-tenant config (apps only)
  changelog.md
```

---

## Launch Presets (5)

### 1. Executive Assistant JARVIS
**Target:** Solo founders, knowledge workers, managers
**Why it's worth paying for:** The inter-workflow dependencies are complex. The morning briefing alone requires chaining calendar, email, Slack, and news APIs with conditional logic that handles weekends, holidays, and travel days differently.

What it includes:
- System prompt tuned for concise, executive communication style
- Morning briefing workflow (pulls calendar, emails, Slack, news relevant to open projects)
- End-of-day summary (what got done, what slipped, what needs attention tomorrow)
- Meeting prep packets generated 30 minutes before each calendar event
- Email triage workflow: auto-labels by urgency, drafts responses to routine emails, flags anything requiring human judgment
- Knowledge base template: company context, key contacts, open initiatives, decision log
- Dashboard layout: unified inbox widget, today's schedule with AI notes, KPI tracker, delegation queue
- Communication style rules: brief (Slack), detailed (email), formal (board updates)
- Weekly reporting workflow: progress summaries from vault activity, calendar data, completed tasks

### 2. Developer JARVIS
**Target:** Professional software developers, tech enthusiasts
**Why it's worth paying for:** Stack-specific knowledge bases and interconnected development workflows take 30+ hours to build properly.

What it includes:
- System prompt tuned for technical precision, code quality, context-aware opinions
- Code review workflow: structured review covering correctness, security, performance, readability, test coverage
- PR description generator: from git diff, generates structured PR description
- Debugging session workflow: tracks error, attempted fixes, lessons learned — prevents circular debugging
- Documentation generator: JSDoc, README sections, API documentation from code
- Architecture Decision Record workflow: logs and surfaces relevant past decisions
- Dependency audit workflow: weekly check on outdated packages, security advisories
- Stack-specific knowledge bases: TypeScript/React, Python/FastAPI, Go, etc.

### 3. Sales JARVIS
**Target:** Solo founders doing outbound, B2B sales reps, account managers
**Why it's worth paying for:** CRM integration + research automation + follow-up tracking requires domain expertise in sales methodology.

What it includes:
- CRM integration workflows (HubSpot, Salesforce via APIs or browser automation fallback)
- Lead research workflow: company brief (news, funding, leadership, pain points, talk tracks)
- Follow-up cadence manager: tracks commitments, surfaces reminders
- Email personalization assistant: generates personalized outreach from lead research
- Pipeline review workflow: weekly deal movement, deals at risk, stale deals
- Call prep workflow: pulls all history, generates talking points
- Win/loss pattern analysis over time

### 4. Deep Work JARVIS
**Target:** Developers, makers, anyone fighting constant interruption
**Why it's worth paying for:** Integrates awareness (M13), authority engine, and vault memory into a seamless focus system.

What it includes:
- Authority engine pre-configured: non-urgent blocked during focus sessions, notifications queued
- Focus session orchestrator: Pomodoro-variant with configurable blocks, automatic DND, blocked site enforcement
- Distraction detection via M13 awareness: flags Reddit/YouTube usage outside break windows
- Context-switching cost tracker: measures interruption frequency and sources, weekly report
- Deep work session memory: reads last session's vault notes, briefs where you left off
- "Shutdown ritual" workflow: captures done/in-progress/open questions, arms next morning briefing
- Dashboard: focus timer, deep work blocks, distraction log, weekly flow chart

### 5. Research JARVIS
**Target:** Founders doing market research, analysts, tech enthusiasts exploring topics
**Why it's worth paying for:** Multi-source research with cross-referencing and knowledge graph building is weeks of configuration.

What it includes:
- Deep research workflow: multi-source web research, cross-references, identifies conflicts, structured report with citations
- Literature review workflow: processes PDFs, extracts claims/methodology/findings, annotated bibliography
- Knowledge graph builder: surfaces connections, contradictions, gaps as research accumulates
- Citation management: APA, MLA, Chicago formatting
- Hypothesis tracking: evidence for/against logged as research progresses
- Source credibility scorer: domain authority, publication type, author credentials
- Research session continuity: picks up where last session ended

---

## Future Preset Backlog

Candidates for batch 2+ based on demand signals. No detailed specs until validated.

- DevOps / SRE — incident response, deployment workflows, post-mortems
- Entrepreneurship — business model canvas, competitive intel, fundraising pipeline
- Data Scientist — experiment tracking, dataset profiling, SQL generation
- Writer — style calibration, consistency enforcement, content repurposing
- Language Learning — spaced repetition, immersive conversation, pronunciation feedback
- Personal Finance — budgeting, spending analysis, savings tracking
- Fitness — adaptive programming, progressive overload, recovery tracking
- Interview Coach — mock interviews, company research, answer library
- Legal & Compliance — contract review, deadline tracking, document generation
- Game Designer — GDD workflow, narrative branching, mechanics balance
- Music Producer — DAW integration, theory companion, release workflow
- Travel Planner — itinerary building, booking tracking, in-trip assistance
- Home Management — maintenance scheduling, warranty tracking, contractor management
- Academic Tutor — Socratic method, study planning, exam prep
- Mental Wellness — journaling, mood tracking, cognitive reframing (requires legal review)
- Sleep Coach — sleep hygiene, chronotype identification, awareness integration
- Diet & Nutrition — meal planning, macro tracking (requires legal review)
- Parenting — developmental tracking, school management, activity generation
- Real Estate — property research, investment analysis, rental management

**Rule:** Health/finance/parenting presets launch ONLY after legal review.

---

## Preset Switching

Users with multiple presets can switch instantly. No reinstall, no daemon restart. Sub-second swap.

### What changes on switch
- Role (system prompt, personality, communication style)
- Dashboard layout
- Active workflows (cron/triggers for that persona)
- Notification rules
- Authority rules

### What stays persistent across all presets
- Vault (all knowledge, memory, contacts, facts, history)
- Conversations
- Goal trees
- Calendar/email integrations
- Channel connections (Telegram, Discord)

### Switch methods

| Method | How |
|--------|-----|
| CLI | `jarvis preset switch developer` |
| Dashboard | Dropdown in top nav — one click |
| Voice | "JARVIS, switch to sales mode" |
| Automatic | Time-based schedule rules |

### Automatic switching

```yaml
preset_schedule:
  - preset: developer
    hours: "9-17"
    days: "mon-fri"
  - preset: sales
    hours: "17-19"
    days: "mon-thu"
  - default: executive-assistant
```

JARVIS detects the schedule and switches silently. The active preset is always visible in the nav bar.

---

## Minimalist JARVIS (Free)

**Target:** Cautious or overwhelmed users — trust-builder and entry point.

What it includes:
- Radically simplified system prompt: quiet, concise, non-proactive, only responds when spoken to
- Stripped dashboard: only chat and a single task list
- Single daily touchpoint: one morning message with what requires a decision today
- Memory-only mode: tracks only what you tell it to
- Complete awareness disable: M13 off by default with clear opt-in

Always free. Converts to paid presets or app subscriptions over time.

---

## Pricing

### Layer 1: Preset Marketplace

**Structural advantage:** Users bring their own API keys. Zero token cost per user. Price purely on value delivered.

| Plan | Monthly | Annual | What's Included |
|------|---------|--------|-----------------|
| Single Preset | $12/mo | $99/yr (31% off) | One persona of your choice |
| Pick 3 | $29/mo | $249/yr (28% off) | Any 3 presets |
| All Access | $39/mo | $349/yr (25% off) | All current + future presets |
| Lifetime — Single | $249 | one-time | One preset, forever. First 200 buyers only. |
| Lifetime — All Access | $699 | one-time | Everything, forever. First 200 buyers only. |

#### Free Tier
- **Minimalist JARVIS**: permanently free
- **1 rotating free preset per quarter** (promotes discovery, drives upgrades)
- Users can always build their own preset manually — the store sells curation and time savings, not core functionality

#### Launch Pricing
$9/mo single preset for first 60 days (instead of $12). Rewards early adopters, generates initial reviews, creates urgency. Early subscribers grandfathered at intro price.

#### Competitive Context
- Notion AI: $10/mo
- Jasper (copywriting): $39/mo
- Superhuman (email): $30/mo
- Craft (writing): $5/mo
- Readwise Reader: $8/mo
- ChatGPT Plus: $20/mo

At $12/mo for a specialized, always-on, local-first AI persona with 20+ hours of expert configuration — strong value.

### Layer 2: App Platform

Builders set their own prices. JARVIS takes a platform cut via Stripe Connect (automatic revenue splitting on every transaction).

| Builder Monthly Revenue | JARVIS Cut |
|---|---|
| $0 - $10k/mo | 20% |
| $10k - $100k/mo | 15% |
| $100k+/mo | 10% |

Decreasing cut rewards success and keeps big builders on the platform rather than rebuilding off it.

#### Builder Costs
- **JARVIS Cloud hosting** (for apps that need managed infrastructure): usage-based pricing TBD
- **Self-hosted option**: builders run their own JARVIS instances, platform cut still applies for Store-listed apps
- **No upfront cost to list** — revenue share only, zero risk for builders

#### What to Avoid
- Per-seat pricing at launch (too much friction)
- Usage-based pricing for presets (confusing when user provides own API key)
- Free trials (attract tire-kickers; use 30-day money-back guarantee instead)
- Taking more than 20% (builders will leave)

---

## Why This Platform Wins

### For Preset Buyers
1. **Expert domain curation** — Sales JARVIS requires sales methodology + CRM integration expertise. You're buying condensed domain knowledge, not YAML files.
2. **Ongoing updates** — Presets evolve with the platform. DIY configs rot as the daemon ships new milestones.
3. **Time-to-value** — Install to useful in minutes. DIY = 20-30 hours of prompt engineering and workflow building.

### For App Builders
1. **Full runtime, not just an API** — JARVIS has state, memory, desktop control, voice, vision, workflows, awareness. Builders get capabilities that would take months to build from scratch.
2. **Multi-tenancy built in** — Each end-user gets isolated data. Builders don't have to build user management infrastructure.
3. **Distribution** — The JARVIS Store is the marketplace. Builders get discovered, not just deployed.
4. **Zero infrastructure (cloud option)** — Deploy to JARVIS Cloud, don't manage servers.

### For the Platform
1. **Onboarding investment** — After 3 months, vault has deep personal context. High switching cost for users.
2. **Network effects** — More apps attract more users, which attracts more builders. Classic platform flywheel.
3. **Revenue compounds** — Each successful app is recurring revenue with zero marginal cost to JARVIS.
4. **Community & social proof** — Reviews, testimonials, shared tips. "Developer JARVIS caught 3 security bugs in my PR" has value a self-config doesn't.

### Platform Moat vs. ChatGPT Wrappers
GPT wrappers are thin because GPT is an API. JARVIS apps are thick because the underlying platform can:
- Control desktops and browsers (not just generate text)
- Run complex multi-step workflows with error recovery
- Maintain persistent memory per user
- React to real-world context via awareness
- Make and receive phone calls
- Execute code and manage files
- Run offline / local-first (privacy-sensitive use cases)
- Operate autonomously with configurable authority levels

---

## Technical Architecture

### Preset Distribution (Layer 1 — Launch)
- `store.jarvis.ai` — HTTPS endpoint serving JSON catalog of available presets
- Bundles hosted on CDN (direct download URLs)
- License: signed JWT stored in `~/.jarvis/licenses/`
  - Contains: preset ID, purchase timestamp, expiry, user identifier (email hash), device fingerprint, signature
  - Daemon verifies against public key on startup and before applying updates
  - Offline-capable for 30 days, re-validates on next connection
- **No DRM** — enough friction to prevent casual sharing, not enough to inconvenience paying users

### App Platform (Layer 2 — Evolution)

#### Multi-Tenancy
- Each app defines tenant isolation in `tenancy.yaml`
- Per-tenant: vault partition, conversation history, workflow state, settings
- Shared across tenants: app logic, workflows definitions, role template, knowledge seeds
- Tenant provisioning API: `POST /api/apps/{appId}/tenants` creates isolated user space

#### JARVIS Cloud
- Managed hosting for apps that need it
- Each app gets a JARVIS daemon instance (or shared instance with tenant isolation)
- Auto-scaling based on tenant count and usage
- Builder dashboard: tenant management, usage metrics, revenue tracking
- Self-hosted option always available (builders run their own infra, still use Store for distribution + billing)

#### Custom UI
- Apps can ship a `ui/` directory with a React frontend
- Mounted at `https://{app-slug}.jarvis.cloud/` or custom domain
- Communicates with JARVIS daemon via the existing API + WebSocket
- Builder can fully brand the experience — end-users see the builder's product, not JARVIS

#### Billing (Stripe Connect)
- Each builder connects their Stripe account
- End-users subscribe to apps via the Store or the app's own UI
- Stripe Connect splits payment automatically: builder gets (100 - platform %) and JARVIS gets platform %
- Builder sets their own price, JARVIS enforces minimum floor ($5/mo)
- Usage tracking for metered billing if builder wants it

### Installation Flow (Presets)
```
jarvis store install executive-assistant
  -> calls store.jarvis.ai/api/presets/executive-assistant
  -> license check: valid JWT?
    -> yes: download bundle, verify signature, unpack to ~/.jarvis/presets/
    -> no: redirect to store purchase URL
  -> read manifest.json, check daemon version compatibility
  -> install workflows (via M14 import API)
  -> install vault seeds (via vault write API)
  -> check plugin dependencies -> prompt to install missing
  -> apply dashboard layout
  -> run onboarding script
  -> activate role.yaml
  -> "Executive Assistant JARVIS is ready."
```

### App Deployment Flow
```
jarvis app deploy receptionist-saas
  -> validate manifest.json (type: "app")
  -> package bundle (.jarvis-app)
  -> sign with builder's key
  -> upload to store.jarvis.ai
  -> automated review: security scan, dependency audit, manifest validation
  -> human review queue (first submission only, updates auto-approved after trust established)
  -> listed on JARVIS Store
  -> builder gets dashboard: installs, revenue, tenant metrics
```

### Switching Flow (Presets)
```
jarvis preset switch sales
  -> validate preset exists in ~/.jarvis/presets/sales/
  -> license check: valid JWT for this preset?
  -> deactivate current preset workflows/triggers
  -> swap active role.yaml
  -> activate sales workflows/triggers
  -> swap dashboard layout
  -> update authority rules
  -> update notification rules
  -> broadcast preset_switched event via WebSocket
  -> "Switched to Sales JARVIS." (<1 second)
```

### Update Mechanism
- Daemon polls `store.jarvis.ai/api/presets/<id>/version` daily
- Workflows: merge new, update existing (preserving user-forked workflows)
- Vault seeds: update seeds only — never touch user-created entries
- Role file: show diff, allow one-click rollback
- Dashboard layout: offer to apply, don't force (user may have customized)

### Store Backend
Next.js + Stripe Connect + Supabase (or PostgreSQL). Catalog, license issuance, CDN hosting, builder dashboards, revenue splitting, review pipeline. Build after preset format is solid, not before.

### Preset/App Authoring CLI
- `jarvis preset package` — produces a signed `.jarvis-preset` bundle
- `jarvis app package` — produces a signed `.jarvis-app` bundle (superset of preset)
- `jarvis app deploy` — uploads to Store
- `jarvis app dev` — local development mode with hot reload

---

## Go-to-Market Strategy

### Phase 1 — Preset Marketplace Launch

**Pre-launch (4-6 weeks before):**
- Publish "JARVIS Store is coming" with 5 preview personas described in detail
- Collect email waitlist
- Invite 20-30 power users to beta test each preset
- Iterate on beta feedback

**Launch day:**
- Show HN: "JARVIS Store — pre-configured AI personas for specific workflows"
- Reddit: r/productivity, r/programming, r/SaaS, r/Entrepreneur
- Product Hunt launch
- Email the waitlist

**30-60 days post-launch:**
- Monitor which presets convert best and why
- Launch batch 2 (3-5 more presets based on demand signals)
- Launch annual pricing and lifetime option

### Phase 2 — App Platform Beta

**3-6 months post preset launch:**
- Open app builder beta to select partners (e.g., the payment company)
- Ship multi-tenancy support
- Ship JARVIS Cloud MVP (managed hosting)
- Ship Stripe Connect integration
- First 3-5 third-party apps live on the Store

### Phase 3 — App Platform GA

**6-12 months post preset launch:**
- Open app submission to all builders
- Builder documentation, SDK, example apps
- Builder dashboard (revenue, tenants, analytics)
- Marketing: "Build a SaaS in a weekend with JARVIS"
- Case studies from Phase 2 partners

### Phase 4 — Platform Flywheel

**12+ months:**
- Community-driven app ecosystem
- Enterprise app deployment (private app stores for companies)
- JARVIS-as-engine deals (like the payment company — custom integrations where JARVIS powers a larger product)
- International expansion (localized presets/apps)

---

## Revenue Streams Summary

| Stream | Timeline | Model | Potential |
|--------|----------|-------|-----------|
| **Preset subscriptions** | Launch | $12-39/mo per user | Moderate — capped by JARVIS user base |
| **App platform cut** | 6-12 months | 10-20% of builder revenue | High — scales with builder success |
| **JARVIS Cloud hosting** | 6-12 months | Usage-based | Moderate — infrastructure margin |
| **Enterprise licensing** | 12-18 months | $50/seat/year, 10-seat min | High — large contracts |
| **Certified consultant network** | 12+ months | Certification fee + referral | Low — brand value, not revenue |
| **Plugin sponsorships** | Post-M15 | Sponsorship deals | Low-moderate — supplementary |
| **Paid community** | Launch | $15/mo | Low — retention tool, not primary revenue |

---

## Product Ladder

```
Free JARVIS (open source, full features, configure yourself)
  |
  v
Minimalist JARVIS (free preset, trust-builder)
  |
  v
Single Preset ($12/mo -- immediate value for specific use case)
  |
  v
Pick 3 / All Access ($29-39/mo -- covers your workflow)
  |
  v
Build & Sell on JARVIS (app platform -- become a builder, earn revenue)
  |
  v
Enterprise ($50/seat/yr -- SSO, compliance, private app store)
```

---

## Key Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| **Users share license JWTs** | Medium | Device fingerprint in JWT. Re-link flow via email for new machines. |
| **Users copy preset files** | Low | Updates stop without license (copies get stale fast). Accept small % free riders. |
| **Preset quality degrades as platform evolves** | High | Versioned presets with min daemon version. 20% of store dev time to maintenance. |
| **LLM quality varies by user's API key** | Medium | Document which model tier each preset is tested against. |
| **Model providers build competing features** | Medium | JARVIS moat is local-first, private, desktop-native, cross-platform. Cloud can't see your screen or run offline. |
| **Open-source community backlash** | Medium | "Platform funds the free core." Transparent from day one. Free All-Access for active contributors. |
| **App quality control** | High | Automated security scanning + human review for first submission. Rating system. Report/takedown process. |
| **Builders leave after reaching scale** | Medium | Decreasing revenue cut at scale. Network effects (users are on the Store). Make it harder to leave than to stay. |
| **JARVIS Cloud reliability** | High | Start with self-hosted option. Cloud is additive, not required. Invest heavily in infrastructure before marketing it. |
| **Legal liability for third-party apps** | High | Clear Terms of Service. Builders are responsible for their apps. Health/finance/legal apps require disclaimers. Platform review for high-risk categories. |

---

## Implementation Order

### Phase 1: Preset Marketplace (M15)
1. **Preset format spec** — manifest.json schema, directory structure, validation rules
2. **Preset switching engine** — sub-second swap of role, workflows, layout, authority, notifications
3. **`jarvis preset package` CLI** — bundle a preset directory into signed `.jarvis-preset`
4. **`jarvis store install/update/list/switch` CLI** — install, update, list, and switch presets
5. **Store backend MVP** — Next.js + Stripe + Supabase catalog, license issuance, CDN hosting
6. **First 5 presets** — Executive Assistant, Developer, Sales, Deep Work, Research
7. **Dashboard preset switcher** — dropdown in nav bar, Store page for browse/install/manage

### Phase 2: App Platform Foundation
8. **Multi-tenancy** — per-tenant vault, conversations, workflow state, settings isolation
9. **Custom UI mounting** — builder ships React frontend, served at app subdomain
10. **App manifest extensions** — type: app, tenancy config, billing config, custom API routes
11. **Stripe Connect integration** — automatic revenue splitting
12. **Builder dashboard** — tenant management, revenue tracking, usage metrics
13. **`jarvis app package/deploy/dev` CLI** — app authoring tools

### Phase 3: JARVIS Cloud
14. **Managed hosting infrastructure** — deploy JARVIS instances for apps
15. **Auto-scaling** — scale based on tenant count and usage
16. **Custom domains** — builders point their domain to their JARVIS app
17. **App review pipeline** — automated security scan + human review queue

### Phase 4: Ecosystem
18. **Builder SDK & documentation** — make it easy to build apps
19. **App store search & discovery** — categories, ratings, featured apps
20. **Enterprise private app stores** — companies deploy internal apps
21. **Community submission pipeline** — authoring guide, review process, marketplace listing

---

*Created: March 2026*
*Updated: March 2026 — Evolved from preset marketplace to full app platform. Added Layer 2 (app platform), builder economics, multi-tenancy, JARVIS Cloud, Stripe Connect, phased GTM, real-world examples (receptionist SaaS, payment vertical generator).*
