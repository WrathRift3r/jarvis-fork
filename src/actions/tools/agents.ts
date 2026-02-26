/**
 * Manage Agents Tool — Multi-Agent Hierarchy
 *
 * Allows the primary agent to spawn persistent sub-agents, assign them tasks
 * (async), check status, collect results, and terminate them.
 *
 * For quick sync delegation (spawn → run → return → terminate in one call),
 * use delegate_task instead.
 */

import type { AgentOrchestrator } from '../../agents/orchestrator.ts';
import type { LLMManager } from '../../llm/manager.ts';
import type { RoleDefinition } from '../../roles/types.ts';
import type { ToolDefinition } from './registry.ts';
import type { AgentTaskManager } from '../../agents/task-manager.ts';
import { createScopedToolRegistry, type ProgressCallback } from '../../agents/sub-agent-runner.ts';

export type AgentToolDeps = {
  orchestrator: AgentOrchestrator;
  llmManager: LLMManager;
  specialists: Map<string, RoleDefinition>;
  taskManager: AgentTaskManager;
  onProgress?: ProgressCallback;
};

// Track scoped registries for persistent agents so they can be reused across tasks
const agentRegistries = new Map<string, ReturnType<typeof createScopedToolRegistry>>();

export function createManageAgentsTool(deps: AgentToolDeps): ToolDefinition {
  return {
    name: 'manage_agents',
    description: [
      'Manage persistent sub-agents for complex or parallel work.',
      'Use this when you need agents that stay alive across multiple tasks or run in parallel.',
      'For quick one-shot tasks, use delegate_task instead.',
      '',
      'Actions:',
      '  spawn     — Create a persistent specialist agent (returns agent_id)',
      '  assign    — Send a task to an existing agent (async, returns task_id)',
      '  status    — Check agent or task status',
      '  collect   — Get full result of a completed task',
      '  list      — Show all active agents and tasks',
      '  terminate — Shut down an agent',
      '',
      'Available specialists: ' + Array.from(deps.specialists.keys()).join(', '),
      '',
      'Workflow: spawn → assign → status/collect → terminate',
    ].join('\n'),
    category: 'delegation',
    parameters: {
      action: {
        type: 'string',
        description: 'The action: spawn, assign, status, collect, list, terminate',
        required: true,
      },
      specialist: {
        type: 'string',
        description: 'Specialist role ID (required for spawn)',
        required: false,
      },
      agent_id: {
        type: 'string',
        description: 'Agent ID (required for assign, terminate; optional for status)',
        required: false,
      },
      task_id: {
        type: 'string',
        description: 'Task ID (for status, collect)',
        required: false,
      },
      task: {
        type: 'string',
        description: 'Task description (required for assign)',
        required: false,
      },
      context: {
        type: 'string',
        description: 'Background context for the task (optional for assign)',
        required: false,
      },
    },
    execute: async (params) => {
      const action = params.action as string;

      switch (action) {
        case 'spawn':
          return handleSpawn(deps, params);
        case 'assign':
          return handleAssign(deps, params);
        case 'status':
          return handleStatus(deps, params);
        case 'collect':
          return handleCollect(deps, params);
        case 'list':
          return handleList(deps);
        case 'terminate':
          return handleTerminate(deps, params);
        default:
          return `Error: Unknown action "${action}". Use: spawn, assign, status, collect, list, terminate`;
      }
    },
  };
}

function handleSpawn(deps: AgentToolDeps, params: Record<string, unknown>): string {
  const specialistId = params.specialist as string;
  if (!specialistId) {
    return 'Error: "specialist" is required for spawn. Available: ' + Array.from(deps.specialists.keys()).join(', ');
  }

  const role = deps.specialists.get(specialistId);
  if (!role) {
    return `Error: Unknown specialist "${specialistId}". Available: ${Array.from(deps.specialists.keys()).join(', ')}`;
  }

  const primary = deps.orchestrator.getPrimary();
  if (!primary) {
    return 'Error: No primary agent exists';
  }

  const agent = deps.orchestrator.spawnSubAgent(primary.id, role);
  const scopedRegistry = createScopedToolRegistry(agent.agent.authority.allowed_tools);
  agentRegistries.set(agent.id, scopedRegistry);

  console.log(`[ManageAgents] Spawned ${role.name} (${agent.id}) with ${scopedRegistry.count()} tools`);

  return JSON.stringify({
    agent_id: agent.id,
    name: role.name,
    specialist: specialistId,
    status: 'idle',
    tools_available: scopedRegistry.count(),
    tool_categories: agent.agent.authority.allowed_tools,
  });
}

async function handleAssign(deps: AgentToolDeps, params: Record<string, unknown>): Promise<string> {
  const agentId = params.agent_id as string;
  const task = params.task as string;
  const context = (params.context as string) || '';

  if (!agentId) return 'Error: "agent_id" is required for assign';
  if (!task) return 'Error: "task" is required for assign';

  const agent = deps.orchestrator.getAgent(agentId);
  if (!agent) return `Error: Agent "${agentId}" not found. Use list to see active agents.`;

  if (deps.taskManager.isAgentBusy(agentId)) {
    return `Error: Agent "${agent.agent.role.name}" is already running a task. Wait for it to finish or terminate it.`;
  }

  const scopedRegistry = agentRegistries.get(agentId);
  if (!scopedRegistry) {
    return `Error: No tool registry for agent "${agentId}". Was it spawned via manage_agents?`;
  }

  // Notify progress
  deps.onProgress?.({
    type: 'text',
    agentName: agent.agent.role.name,
    agentId,
    data: `[Assigning task to ${agent.agent.role.name}...]`,
  });

  const taskId = deps.taskManager.launch({
    agent,
    task,
    context,
    llmManager: deps.llmManager,
    toolRegistry: scopedRegistry,
    onProgress: deps.onProgress,
  });

  console.log(`[ManageAgents] Assigned task ${taskId} to ${agent.agent.role.name}`);

  return JSON.stringify({
    task_id: taskId,
    agent_id: agentId,
    agent_name: agent.agent.role.name,
    status: 'running',
    message: `Task assigned to ${agent.agent.role.name}. Use status or collect to check progress.`,
  });
}

function handleStatus(deps: AgentToolDeps, params: Record<string, unknown>): string {
  const taskId = params.task_id as string;
  const agentId = params.agent_id as string;

  if (taskId) {
    const task = deps.taskManager.getTask(taskId);
    if (!task) return `Error: Task "${taskId}" not found`;

    const elapsed = task.completedAt
      ? task.completedAt - task.startedAt
      : Date.now() - task.startedAt;

    return JSON.stringify({
      task_id: task.id,
      agent_name: task.agentName,
      status: task.status,
      task: task.task,
      elapsed_ms: elapsed,
      elapsed_seconds: Math.round(elapsed / 1000),
      has_result: task.result !== null,
    });
  }

  if (agentId) {
    const agent = deps.orchestrator.getAgent(agentId);
    if (!agent) return `Error: Agent "${agentId}" not found`;

    const agentTask = deps.taskManager.getAgentTask(agentId);
    return JSON.stringify({
      agent_id: agentId,
      name: agent.agent.role.name,
      status: agent.agent.status,
      current_task: agent.agent.current_task,
      busy: deps.taskManager.isAgentBusy(agentId),
      latest_task: agentTask ? {
        task_id: agentTask.id,
        status: agentTask.status,
        task: agentTask.task,
      } : null,
    });
  }

  // No ID given — return summary
  return handleList(deps);
}

function handleCollect(deps: AgentToolDeps, params: Record<string, unknown>): string {
  const taskId = params.task_id as string;
  if (!taskId) return 'Error: "task_id" is required for collect';

  const task = deps.taskManager.getTask(taskId);
  if (!task) return `Error: Task "${taskId}" not found`;

  if (task.status === 'running') {
    const elapsed = Math.round((Date.now() - task.startedAt) / 1000);
    return JSON.stringify({
      task_id: task.id,
      status: 'running',
      agent_name: task.agentName,
      elapsed_seconds: elapsed,
      message: 'Task is still running. Check back later.',
    });
  }

  const result = task.result!;
  const toolsList = result.toolsUsed.length > 0
    ? result.toolsUsed.join(', ')
    : 'none';

  return JSON.stringify({
    task_id: task.id,
    status: task.status,
    agent_name: task.agentName,
    success: result.success,
    response: result.response,
    tools_used: toolsList,
    tokens_used: result.tokensUsed.input + result.tokensUsed.output,
    elapsed_seconds: Math.round(((task.completedAt ?? Date.now()) - task.startedAt) / 1000),
  });
}

function handleList(deps: AgentToolDeps): string {
  const allAgents = deps.orchestrator.getAllAgents();
  const primary = deps.orchestrator.getPrimary();

  // Filter to sub-agents only (not the primary)
  const subAgents = allAgents.filter(a => a.id !== primary?.id);

  const agents = subAgents.map(a => ({
    agent_id: a.id,
    name: a.agent.role.name,
    specialist: a.agent.role.id,
    status: a.agent.status,
    current_task: a.agent.current_task,
    busy: deps.taskManager.isAgentBusy(a.id),
  }));

  const tasks = deps.taskManager.listTasks().map(t => ({
    task_id: t.id,
    agent_name: t.agentName,
    status: t.status,
    task: t.task.slice(0, 100),
    elapsed_seconds: Math.round(((t.completedAt ?? Date.now()) - t.startedAt) / 1000),
  }));

  return JSON.stringify({
    active_agents: agents.length,
    agents,
    tasks_total: tasks.length,
    tasks_running: tasks.filter(t => t.status === 'running').length,
    tasks,
  });
}

function handleTerminate(deps: AgentToolDeps, params: Record<string, unknown>): string {
  const agentId = params.agent_id as string;
  if (!agentId) return 'Error: "agent_id" is required for terminate';

  const agent = deps.orchestrator.getAgent(agentId);
  if (!agent) return `Error: Agent "${agentId}" not found`;

  const name = agent.agent.role.name;

  // Clean up registry
  agentRegistries.delete(agentId);

  // Terminate via orchestrator (cascades to children)
  deps.orchestrator.terminateAgent(agentId);

  console.log(`[ManageAgents] Terminated ${name} (${agentId})`);

  return JSON.stringify({
    terminated: agentId,
    name,
    message: `${name} terminated.`,
  });
}
