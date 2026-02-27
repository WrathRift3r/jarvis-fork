/**
 * J.A.R.V.I.S. Daemon
 *
 * Main entry point for the JARVIS daemon process.
 * Initializes database, registers real services (Agent, Observer, WebSocket),
 * starts health monitoring, and handles graceful shutdown.
 */

import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { initDatabase, closeDb } from "../vault/schema.ts";
import { ServiceRegistry } from "./services.ts";
import { HealthMonitor } from "./health.ts";
import { loadConfig } from "../config/loader.ts";
import { AgentService } from "./agent-service.ts";
import { ObserverService } from "./observer-service.ts";
import { WebSocketService } from "./ws-service.ts";
import { EventReactor } from "./event-reactor.ts";
import { EventCoalescer } from "./event-coalescer.ts";
import { CommitmentExecutor } from "./commitment-executor.ts";
import { checkCommitments } from "./event-classifier.ts";
import { createApiRoutes } from "./api-routes.ts";
import { GoogleAuth } from "../integrations/google-auth.ts";
import { ResearchQueue } from "./research-queue.ts";
import { researchQueueTool, setResearchQueueRef } from "../actions/tools/research.ts";
import { ChannelService } from "./channel-service.ts";
import { BackgroundAgentService } from "./background-agent-service.ts";
import { AuthorityEngine } from "../authority/engine.ts";
import { ApprovalManager } from "../authority/approval.ts";
import { AuditTrail } from "../authority/audit.ts";
import { AuthorityLearner } from "../authority/learning.ts";
import { EmergencyController } from "../authority/emergency.ts";
import { ApprovalDelivery } from "../authority/approval-delivery.ts";
import { DeferredExecutor } from "../authority/deferred-executor.ts";

// Constants
const DEFAULT_PORT = 3142;  // JARVIS port
const DEFAULT_DATA_DIR = path.join(os.homedir(), '.jarvis');

export interface DaemonConfig {
  port: number;
  dbPath: string;
  dataDir: string;
  healthCheckInterval?: number;  // ms
}

let shutdownInProgress = false;
let registry: ServiceRegistry | null = null;
let healthMonitor: HealthMonitor | null = null;
let heartbeatTimer: Timer | null = null;
let commitmentExecutor: CommitmentExecutor | null = null;
let bgAgent: BackgroundAgentService | null = null;

/**
 * Parse command line arguments
 */
function parseArgs(): Partial<DaemonConfig> {
  const args = process.argv.slice(2);
  const config: Partial<DaemonConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--port':
        config.port = parseInt(args[++i], 10);
        break;
      case '--db-path':
        config.dbPath = args[++i];
        break;
      case '--data-dir':
        config.dataDir = args[++i];
        break;
      case '--health-interval':
        config.healthCheckInterval = parseInt(args[++i], 10);
        break;
      case '--help':
      case '-h':
        console.log(`
J.A.R.V.I.S. Daemon

Usage:
  bun run src/daemon/index.ts [options]

Options:
  --port <number>          WebSocket server port (default: ${DEFAULT_PORT})
  --db-path <path>         Database file path (default: ~/.jarvis/jarvis.db)
  --data-dir <path>        Data directory (default: ~/.jarvis)
  --health-interval <ms>   Health check interval in ms (default: 30000)
  --help, -h               Show this help message

Example:
  bun run src/daemon/index.ts --port 3142 --data-dir ~/.jarvis
        `);
        process.exit(0);
    }
  }

  return config;
}

/**
 * Ensure data directory exists
 */
function ensureDataDir(dataDir: string): void {
  if (!existsSync(dataDir)) {
    console.log(`[Daemon] Creating data directory: ${dataDir}`);
    mkdirSync(dataDir, { recursive: true });
  }
}

/**
 * Log timestamp helper
 */
function logWithTimestamp(message: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

/**
 * Handle graceful shutdown
 */
async function handleShutdown(signal: string): Promise<void> {
  if (shutdownInProgress) {
    console.log('\n[Daemon] Force shutdown requested, exiting immediately');
    process.exit(1);
  }

  shutdownInProgress = true;
  console.log(`\n[Daemon] Received ${signal}, shutting down gracefully...`);

  try {
    // Clear heartbeat timer
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    // Stop commitment executor
    if (commitmentExecutor) {
      commitmentExecutor.stop();
      commitmentExecutor = null;
    }

    // Stop background agent (separate browser)
    if (bgAgent) {
      await bgAgent.stop();
      bgAgent = null;
    }

    // Stop desktop sidecar if connected
    try {
      const { desktop } = await import('../actions/tools/desktop.ts');
      if (desktop.connected) await desktop.disconnect();
    } catch { /* ignore */ }

    // Stop health monitor
    if (healthMonitor) {
      healthMonitor.stop();
    }

    // Stop all services (reverse order: websocket -> observers -> agent)
    if (registry) {
      await registry.stopAll();
    }

    // Close database
    closeDb();
    console.log('[Daemon] Database closed');

    console.log('[Daemon] Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('[Daemon] Error during shutdown:', error);
    process.exit(1);
  }
}

/**
 * Print startup banner
 */
function printBanner(config: DaemonConfig): void {
  console.log(`
     ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
     ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
     ██║███████║██████╔╝██║   ██║██║███████╗
██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
 ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝

Just A Rather Very Intelligent System
  `);
  console.log('[Daemon] Configuration:');
  console.log(`  Port:      ${config.port}`);
  console.log(`  Data Dir:  ${config.dataDir}`);
  console.log(`  DB Path:   ${config.dbPath}`);
  console.log('');
}

/**
 * Start the JARVIS daemon
 */
export async function startDaemon(userConfig?: Partial<DaemonConfig>): Promise<void> {
  // Load config from YAML (with defaults)
  const jarvisConfig = await loadConfig();

  // Determine data directory: CLI args > config file > default
  const dataDir = userConfig?.dataDir ?? jarvisConfig.daemon.data_dir ?? DEFAULT_DATA_DIR;

  // If user specified a custom data dir but no db path, use jarvis.db in that dir
  const dbPath = userConfig?.dbPath ?? jarvisConfig.daemon.db_path ?? path.join(dataDir, 'jarvis.db');

  // Merge configuration
  const port = userConfig?.port ?? jarvisConfig.daemon.port ?? DEFAULT_PORT;
  const config: DaemonConfig = {
    port,
    dataDir,
    dbPath,
    healthCheckInterval: userConfig?.healthCheckInterval ?? 30000,
  };

  // If dbPath is relative, make it absolute within dataDir
  if (!path.isAbsolute(config.dbPath)) {
    config.dbPath = path.join(config.dataDir, config.dbPath);
  }

  printBanner(config);

  try {
    // 1. Ensure data directory exists
    ensureDataDir(config.dataDir);

    // 2. Initialize database
    logWithTimestamp(`Initializing database at ${config.dbPath}`);
    initDatabase(config.dbPath);
    logWithTimestamp('Database initialized successfully');

    // 3. Create service registry
    registry = new ServiceRegistry();

    // 4. Create proactive modules
    const heartbeatConfig = jarvisConfig.heartbeat;
    const reactor = new EventReactor();
    const coalescer = new EventCoalescer();

    // 4b. Create GoogleAuth if configured
    let googleAuth: GoogleAuth | null = null;
    if (jarvisConfig.google?.client_id && jarvisConfig.google?.client_secret) {
      googleAuth = new GoogleAuth(jarvisConfig.google.client_id, jarvisConfig.google.client_secret);
      if (googleAuth.isAuthenticated()) {
        console.log('[Daemon] Google OAuth: authenticated (Gmail + Calendar observers enabled)');
      } else {
        console.log('[Daemon] Google OAuth: credentials found but not authenticated');
        console.log('[Daemon] Run: bun run src/scripts/google-setup.ts to authorize');
      }
    }

    // 4c. Create research queue
    const researchQueue = new ResearchQueue();
    setResearchQueueRef(researchQueue);

    // 5. Create real services
    const agentService = new AgentService(jarvisConfig);
    agentService.setResearchQueue(researchQueue);
    const observerService = new ObserverService(reactor, coalescer, googleAuth ?? undefined);
    const wsService = new WebSocketService(config.port, agentService);

    // 5b. Create channel service for external comms (Telegram, Discord)
    const channelService = new ChannelService(jarvisConfig, agentService);

    // 5c. Create commitment executor (notify-then-execute)
    const aggressiveness = heartbeatConfig?.aggressiveness ?? 'moderate';
    const executor = new CommitmentExecutor(aggressiveness as any);

    // 6. Wire reactor callback for WebSocket notifications
    reactor.setReactionCallback((text, priority) => {
      wsService.broadcastNotification(text, priority);
    });
    // Note: reactor.setAgentService + executor.setAgentService wired to bgAgent after startAll (step 10c)

    // 6b. Wire delegation progress to WebSocket for sub-agent visibility
    agentService.setDelegationProgressCallback((event) => {
      wsService.broadcastSubAgentProgress(event);
    });

    // 7. Register services in startup order
    //    Agent first (needs DB), Observers second, Channels third, WebSocket last (needs Agent)
    registry.register(agentService);
    registry.register(observerService);
    registry.register(channelService);
    registry.register(wsService);

    // 8. Start health monitor (before services, so API routes can reference it)
    healthMonitor = new HealthMonitor(registry, config.dbPath);

    // 8b. Wire channel service to WebSocket for cross-channel broadcasts
    wsService.setChannelService(channelService);

    // 8c. Wire TTS provider if configured
    if (jarvisConfig.tts?.enabled) {
      const { createTTSProvider } = await import('../comms/voice.ts');
      const ttsProvider = createTTSProvider(jarvisConfig.tts);
      if (ttsProvider) {
        wsService.setTTSProvider(ttsProvider);
        console.log(`[Daemon] TTS enabled: ${jarvisConfig.tts.voice ?? 'en-US-AriaNeural'}`);
      }
    }

    // 8d. Wire STT provider for voice input via dashboard
    if (jarvisConfig.stt) {
      const { createSTTProvider } = await import('../comms/voice.ts');
      const sttProvider = createSTTProvider(jarvisConfig.stt);
      if (sttProvider) {
        wsService.setSTTProvider(sttProvider);
        console.log(`[Daemon] STT for voice input: ${jarvisConfig.stt.provider}`);
      }
    }

    // 8e. Wire Authority & Autonomy Engine
    const authorityConfig = jarvisConfig.authority ?? { default_level: 3 };
    const authorityEngine = new AuthorityEngine({
      default_level: authorityConfig.default_level,
      governed_categories: authorityConfig.governed_categories ?? ['send_email', 'send_message', 'make_payment'],
      overrides: authorityConfig.overrides ?? [],
      context_rules: authorityConfig.context_rules ?? [],
      learning: authorityConfig.learning ?? { enabled: true, suggest_threshold: 5 },
      emergency_state: authorityConfig.emergency_state ?? 'normal',
    });
    const approvalManager = new ApprovalManager();
    const auditTrail = new AuditTrail();
    const learner = new AuthorityLearner(authorityConfig.learning?.suggest_threshold ?? 5);
    const emergencyController = new EmergencyController();
    const approvalDelivery = new ApprovalDelivery();
    const deferredExecutor = new DeferredExecutor(approvalManager, auditTrail);
    deferredExecutor.setLearner(learner);

    // Restore emergency state from config
    const savedEmergencyState = authorityConfig.emergency_state ?? 'normal';
    if (savedEmergencyState === 'paused') emergencyController.pause();
    else if (savedEmergencyState === 'killed') emergencyController.kill();

    // Persist emergency state changes to config.yaml
    emergencyController.setStateChangeCallback(async (state) => {
      wsService.broadcastEmergencyState(state);
      try {
        const { loadConfig: reloadConfig, saveConfig: resaveConfig } = await import('../config/loader.ts');
        const fresh = await reloadConfig();
        if (!fresh.authority) fresh.authority = { default_level: 3 } as any;
        fresh.authority.emergency_state = state;
        await resaveConfig(fresh);
      } catch (err) {
        console.error('[Daemon] Failed to persist emergency state:', err);
      }
    });

    // Wire authority engine into orchestrator
    const orchestrator = agentService.getOrchestrator();
    orchestrator.setAuthorityEngine(authorityEngine);
    orchestrator.setApprovalManager(approvalManager);
    orchestrator.setAuditTrail(auditTrail);
    orchestrator.setEmergencyController(emergencyController);

    // Wire approval callback: when orchestrator needs approval, deliver to user
    orchestrator.setApprovalCallback((request) => {
      approvalDelivery.deliver(request).catch(err =>
        console.error('[Daemon] Approval delivery error:', err)
      );
    });

    // Wire authority engine into agent-service for prompt context
    agentService.setAuthorityEngine(authorityEngine);

    // Wire deferred executor tool registry (after start, tools are registered)
    // Note: toolRegistry set after startAll() below

    // Wire channel approval handler
    channelService.setApprovalHandler(async (action, shortId, channel) => {
      const request = approvalManager.findByShortId(shortId);
      if (!request) return `No pending approval found for ID ${shortId}`;

      if (action === 'approve') {
        const approved = approvalManager.approve(request.id, channel);
        if (!approved) return 'Request already decided';
        const result = await deferredExecutor.executeApproved(request.id);
        const updated = approvalManager.getRequest(request.id);
        if (updated) wsService.broadcastApprovalUpdate(updated);
        return `Approved and executed. Result: ${result.slice(0, 200)}`;
      } else {
        const denied = approvalManager.deny(request.id, channel);
        if (!denied) return 'Request already decided';
        deferredExecutor.recordDenial(denied);
        wsService.broadcastApprovalUpdate(denied);
        return `Denied: ${request.tool_name}`;
      }
    });

    console.log(`[Daemon] Authority engine initialized (governed: ${authorityEngine.getConfig().governed_categories.join(', ')})`);

    // 9. Set up API routes + dashboard static files
    const apiRoutes = createApiRoutes({
      healthMonitor,
      agentService,
      config: jarvisConfig,
      wsService,
      channelService,
      authorityEngine,
      approvalManager,
      auditTrail,
      learner,
      emergencyController,
      deferredExecutor,
    });
    wsService.setApiRoutes(apiRoutes);

    // Serve pre-built dashboard from ui/dist/
    const uiDistDir = path.join(import.meta.dir, '../../ui/dist');
    wsService.setStaticDir(uiDistDir);

    // Serve public assets (wake word models, WASM) from ui/public/
    const uiPublicDir = path.join(import.meta.dir, '../../ui/public');
    wsService.setPublicDir(uiPublicDir);

    // 10. Start all services
    await registry.startAll();

    // 10a-post. Wire authority components that need running services
    const toolRegistry = orchestrator.getToolRegistry();
    if (toolRegistry) {
      deferredExecutor.setToolRegistry(toolRegistry);
    }
    approvalDelivery.setBroadcaster(wsService);
    approvalDelivery.setChannelSender(channelService);
    deferredExecutor.setResultCallback((requestId, request, result) => {
      // Notify via WS and channels that an approved action was executed
      const text = `[EXECUTED] ${request.tool_name}: ${result.slice(0, 200)}`;
      wsService.broadcastNotification(text, 'normal');
    });

    // 10b. Create and start background agent (needs LLM providers from agentService.start())
    const bgAgentService = new BackgroundAgentService(jarvisConfig, agentService.getLLMManager());
    bgAgentService.setResearchQueue(researchQueue);
    await bgAgentService.start();
    bgAgent = bgAgentService;
    console.log('[Daemon] Background agent started (separate browser for heartbeat/reactions)');

    // 10c. Wire reactor + executor to background agent (separate browser, no chat contention)
    reactor.setAgentService(bgAgentService);
    executor.setAgentService(bgAgentService);

    // 10d. Wire executor broadcast (needs wsServer running) and start
    executor.setBroadcast((msg) => wsService.getServer().broadcast(msg));
    wsService.setCommitmentExecutor(executor);
    executor.start();
    commitmentExecutor = executor;

    // 11. Start health monitoring
    healthMonitor.start(config.healthCheckInterval);

    // 12. Set up heartbeat timer with configurable interval and active hours
    const heartbeatIntervalMs = (heartbeatConfig?.interval_minutes ?? 15) * 60 * 1000;
    const activeHours = heartbeatConfig?.active_hours ?? { start: 8, end: 23 };

    console.log(`[Daemon] Heartbeat interval: ${heartbeatConfig?.interval_minutes ?? 15} min, active hours: ${activeHours.start}:00-${activeHours.end}:00`);

    heartbeatTimer = setInterval(async () => {
      // Check if within active hours
      const currentHour = new Date().getHours();
      if (currentHour < activeHours.start || currentHour >= activeHours.end) {
        console.log(`[Daemon] Outside active hours (${activeHours.start}-${activeHours.end}), skipping heartbeat`);
        return;
      }

      try {
        // Check commitments and route critical/high ones to reactor
        const commitmentEvents = checkCommitments();
        for (const evt of commitmentEvents) {
          if (evt.priority === 'critical' || evt.priority === 'high') {
            reactor.react(evt).catch(err =>
              console.error('[Daemon] Commitment reaction error:', err)
            );
          } else {
            coalescer.addEvent(evt);
          }
        }

        // Flush coalesced events for heartbeat
        const coalescedSummary = coalescer.flush();

        // Run heartbeat on BACKGROUND agent (separate browser, doesn't block chat)
        const heartbeatResponse = await bgAgentService.handleHeartbeat(
          coalescedSummary || undefined
        );

        if (heartbeatResponse) {
          console.log('[Daemon] Heartbeat response:', heartbeatResponse.slice(0, 100));
          wsService.broadcastHeartbeat(heartbeatResponse);
        }
      } catch (err) {
        console.error('[Daemon] Heartbeat error:', err);
      }
    }, heartbeatIntervalMs);

    logWithTimestamp(`JARVIS daemon running on port ${config.port}`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');

    // Print initial health status
    console.log(healthMonitor.formatHealth());
    console.log('');

  } catch (error) {
    console.error('[Daemon] Fatal error during startup:', error);
    process.exit(1);
  }
}

// Register signal handlers
process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('[Daemon] Uncaught exception:', error);
  handleShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);

  // Browser timeouts and CDP errors should NOT crash the daemon
  if (msg.includes('Timeout waiting for') || msg.includes('CDP')) {
    console.warn('[Daemon] Non-fatal browser error (ignoring):', msg);
    return;
  }

  console.error('[Daemon] Unhandled rejection:', reason);
  handleShutdown('unhandledRejection');
});

// Run as CLI if executed directly
if (import.meta.main) {
  const args = parseArgs();
  await startDaemon(args);
}
