/**
 * Desktop Tools — Windows Desktop Automation
 *
 * 8 tools for controlling Windows desktop applications via the
 * desktop-bridge sidecar (FlaUI). Follows the same pattern as
 * the browser tools in builtin.ts.
 */

import { DesktopController, type DesktopSnapshot, type FlatElement } from '../app-control/desktop-controller.ts';
import type { ToolDefinition, ToolResult } from './registry.ts';

// Shared desktop controller (lazy-connected on first use)
export const desktop = new DesktopController();

const MAX_ELEMENTS_SHOWN = 60;

/**
 * Format a desktop snapshot for LLM consumption.
 * Mirrors formatSnapshot() for browser pages.
 */
export function formatDesktopSnapshot(snap: DesktopSnapshot): string {
  const lines: string[] = [];
  lines.push(`Window: ${snap.window.title}`);
  lines.push(`PID: ${snap.window.pid}`);
  lines.push(`Class: ${snap.window.className}`);
  lines.push('');

  if (snap.elements.length === 0) {
    lines.push('(no UI elements found)');
    return lines.join('\n');
  }

  const shown = snap.elements.slice(0, MAX_ELEMENTS_SHOWN);
  lines.push(`--- UI Elements (${shown.length}/${snap.totalElements}) ---`);

  for (const el of shown) {
    const indent = '  '.repeat(el.depth);
    const nameStr = el.name ? ` "${el.name}"` : '';
    const valueStr = el.value ? ` value="${el.value}"` : '';
    const disabledStr = !el.isEnabled ? ' (disabled)' : '';
    lines.push(`${indent}[${el.id}] ${el.role}${nameStr}${valueStr}${disabledStr}`);
  }

  if (snap.totalElements > MAX_ELEMENTS_SHOWN) {
    lines.push(`... (${snap.totalElements - MAX_ELEMENTS_SHOWN} more elements not shown)`);
  }

  return lines.join('\n');
}

// --- Tool definitions ---

export const desktopListWindowsTool: ToolDefinition = {
  name: 'desktop_list_windows',
  description: 'List all visible windows on the Windows desktop. Returns window titles, PIDs, class names, and positions. Use the PID with other desktop tools to target a specific window.',
  category: 'desktop',
  parameters: {},
  execute: async () => {
    try {
      const windows = await desktop.listWindows();
      if (windows.length === 0) {
        return '(no visible windows found)';
      }

      const lines: string[] = [`Found ${windows.length} windows:`, ''];
      for (const w of windows) {
        const focusStr = w.focused ? ' [FOCUSED]' : '';
        lines.push(`PID ${w.pid}: "${w.title}" (${w.className})${focusStr}`);
        lines.push(`  Position: ${w.bounds.x},${w.bounds.y} Size: ${w.bounds.width}x${w.bounds.height}`);
      }

      return lines.join('\n');
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const desktopSnapshotTool: ToolDefinition = {
  name: 'desktop_snapshot',
  description: 'Get the UI element tree of a window (like browser_snapshot but for desktop apps). Each element has an [id] you can use with desktop_click and desktop_type. If no pid is given, snapshots the active (focused) window.',
  category: 'desktop',
  parameters: {
    pid: {
      type: 'number',
      description: 'Process ID of the window (from desktop_list_windows). Omit for the active window.',
      required: false,
    },
  },
  execute: async (params) => {
    try {
      const pid = params.pid as number | undefined;
      const snap = await desktop.snapshot(pid);
      return formatDesktopSnapshot(snap);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const desktopClickTool: ToolDefinition = {
  name: 'desktop_click',
  description: 'Click a UI element by its [id] from the last desktop_snapshot. After clicking, use desktop_snapshot to see the updated state.',
  category: 'desktop',
  parameters: {
    element_id: {
      type: 'number',
      description: 'The [id] of the element to click (from desktop_snapshot)',
      required: true,
    },
  },
  execute: async (params) => {
    try {
      return await desktop.clickById(params.element_id as number);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const desktopTypeTool: ToolDefinition = {
  name: 'desktop_type',
  description: 'Type text into a UI element. Optionally provide an element_id to click and focus it first. Without element_id, types into whatever is currently focused.',
  category: 'desktop',
  parameters: {
    text: {
      type: 'string',
      description: 'The text to type',
      required: true,
    },
    element_id: {
      type: 'number',
      description: 'Optional [id] of element to click before typing (from desktop_snapshot)',
      required: false,
    },
  },
  execute: async (params) => {
    try {
      const elementId = params.element_id as number | undefined;
      return await desktop.typeById(elementId, params.text as string);
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const desktopPressKeysTool: ToolDefinition = {
  name: 'desktop_press_keys',
  description: 'Press a keyboard shortcut or key combination. Keys are pressed simultaneously (e.g., ["ctrl","s"] for save, ["alt","f4"] to close, ["ctrl","shift","s"] for save-as). Single keys also work: ["enter"], ["tab"], ["escape"].',
  category: 'desktop',
  parameters: {
    keys: {
      type: 'string',
      description: 'Comma-separated key names (e.g., "ctrl,s" or "alt,f4" or "enter"). Modifiers: ctrl, alt, shift, win.',
      required: true,
    },
  },
  execute: async (params) => {
    try {
      const keysStr = params.keys as string;
      const keys = keysStr.split(',').map((k) => k.trim().toLowerCase());
      await desktop.pressKeys(keys);
      return `Pressed: ${keys.join('+')}`;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const desktopLaunchAppTool: ToolDefinition = {
  name: 'desktop_launch_app',
  description: 'Launch a Windows application by executable path or name (e.g., "notepad.exe", "calc.exe", "C:\\Program Files\\...\\app.exe"). Returns the PID of the launched process.',
  category: 'desktop',
  parameters: {
    executable: {
      type: 'string',
      description: 'Application executable path or name',
      required: true,
    },
    args: {
      type: 'string',
      description: 'Optional command-line arguments',
      required: false,
    },
  },
  execute: async (params) => {
    try {
      const result = await desktop.launchApp(
        params.executable as string,
        params.args as string | undefined,
      ) as any;
      return `Launched ${result.processName} (PID: ${result.pid}) — "${result.title}"`;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const desktopScreenshotTool: ToolDefinition = {
  name: 'desktop_screenshot',
  description: 'Take a screenshot of the entire Windows desktop or a specific window. The image is sent directly to the AI for visual analysis. Useful for complex UIs, graphics apps, or when the element tree is insufficient.',
  category: 'desktop',
  parameters: {
    pid: {
      type: 'number',
      description: 'Process ID of window to capture. Omit for full desktop screenshot.',
      required: false,
    },
  },
  execute: async (params) => {
    try {
      const pid = params.pid as number | undefined;
      const { base64, mimeType } = await desktop.screenshotBase64(pid);
      return {
        content: [
          { type: 'text' as const, text: `Desktop screenshot captured (${pid ? 'window PID ' + pid : 'full screen'})` },
          { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType, data: base64 } },
        ],
      } satisfies ToolResult;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

export const desktopFocusWindowTool: ToolDefinition = {
  name: 'desktop_focus_window',
  description: 'Bring a window to the foreground by its PID (from desktop_list_windows). Use this before interacting with a background window.',
  category: 'desktop',
  parameters: {
    pid: {
      type: 'number',
      description: 'Process ID of the window to focus',
      required: true,
    },
  },
  execute: async (params) => {
    try {
      await desktop.focusWindow(params.pid as number);
      return `Window focused (PID: ${params.pid})`;
    } catch (err) {
      return `Error: ${err instanceof Error ? err.message : String(err)}`;
    }
  },
};

/**
 * All desktop tools in a single array.
 */
export const DESKTOP_TOOLS: ToolDefinition[] = [
  desktopListWindowsTool,
  desktopSnapshotTool,
  desktopClickTool,
  desktopTypeTool,
  desktopPressKeysTool,
  desktopLaunchAppTool,
  desktopScreenshotTool,
  desktopFocusWindowTool,
];

/**
 * Create desktop tools bound to a specific DesktopController.
 * Used to give the background agent its own controller instance.
 */
export function createDesktopTools(ctrl: DesktopController): ToolDefinition[] {
  return [
    {
      ...desktopListWindowsTool,
      execute: async () => {
        try {
          const windows = await ctrl.listWindows();
          if (windows.length === 0) return '(no visible windows found)';
          const lines: string[] = [`Found ${windows.length} windows:`, ''];
          for (const w of windows) {
            const focusStr = w.focused ? ' [FOCUSED]' : '';
            lines.push(`PID ${w.pid}: "${w.title}" (${w.className})${focusStr}`);
            lines.push(`  Position: ${w.bounds.x},${w.bounds.y} Size: ${w.bounds.width}x${w.bounds.height}`);
          }
          return lines.join('\n');
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      ...desktopSnapshotTool,
      execute: async (params) => {
        try {
          const snap = await ctrl.snapshot(params.pid as number | undefined);
          return formatDesktopSnapshot(snap);
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      ...desktopClickTool,
      execute: async (params) => {
        try {
          return await ctrl.clickById(params.element_id as number);
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      ...desktopTypeTool,
      execute: async (params) => {
        try {
          return await ctrl.typeById(params.element_id as number | undefined, params.text as string);
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      ...desktopPressKeysTool,
      execute: async (params) => {
        try {
          const keys = (params.keys as string).split(',').map((k) => k.trim().toLowerCase());
          await ctrl.pressKeys(keys);
          return `Pressed: ${keys.join('+')}`;
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      ...desktopLaunchAppTool,
      execute: async (params) => {
        try {
          const result = await ctrl.launchApp(params.executable as string, params.args as string | undefined) as any;
          return `Launched ${result.processName} (PID: ${result.pid}) — "${result.title}"`;
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      ...desktopScreenshotTool,
      execute: async (params) => {
        try {
          const pid = params.pid as number | undefined;
          const { base64, mimeType } = await ctrl.screenshotBase64(pid);
          return {
            content: [
              { type: 'text' as const, text: `Desktop screenshot captured (${pid ? 'window PID ' + pid : 'full screen'})` },
              { type: 'image' as const, source: { type: 'base64' as const, media_type: mimeType, data: base64 } },
            ],
          } satisfies ToolResult;
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
    {
      ...desktopFocusWindowTool,
      execute: async (params) => {
        try {
          await ctrl.focusWindow(params.pid as number);
          return `Window focused (PID: ${params.pid})`;
        } catch (err) {
          return `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
      },
    },
  ];
}
