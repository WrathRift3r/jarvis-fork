import { test, expect, describe } from 'bun:test';
import { DESKTOP_TOOLS, createDesktopTools, formatDesktopSnapshot } from './desktop.ts';
import { DesktopController } from '../app-control/desktop-controller.ts';
import type { DesktopSnapshot } from '../app-control/desktop-controller.ts';

describe('DESKTOP_TOOLS', () => {
  test('contains 8 desktop tools', () => {
    expect(DESKTOP_TOOLS).toHaveLength(8);
  });

  test('all have desktop category', () => {
    for (const tool of DESKTOP_TOOLS) {
      expect(tool.category).toBe('desktop');
    }
  });

  test('tool names match expected desktop tools', () => {
    const names = DESKTOP_TOOLS.map(t => t.name).sort();
    expect(names).toEqual([
      'desktop_click',
      'desktop_focus_window',
      'desktop_launch_app',
      'desktop_list_windows',
      'desktop_press_keys',
      'desktop_screenshot',
      'desktop_snapshot',
      'desktop_type',
    ]);
  });

  test('all tools have execute functions', () => {
    for (const tool of DESKTOP_TOOLS) {
      expect(typeof tool.execute).toBe('function');
    }
  });

  test('all tools have descriptions', () => {
    for (const tool of DESKTOP_TOOLS) {
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });
});

describe('createDesktopTools', () => {
  test('returns 8 tools bound to controller', () => {
    const ctrl = new DesktopController(9999);
    const tools = createDesktopTools(ctrl);
    expect(tools).toHaveLength(8);
  });

  test('all created tools have desktop category', () => {
    const ctrl = new DesktopController(9999);
    const tools = createDesktopTools(ctrl);
    for (const tool of tools) {
      expect(tool.category).toBe('desktop');
    }
  });

  test('created tool names match DESKTOP_TOOLS', () => {
    const ctrl = new DesktopController(9999);
    const tools = createDesktopTools(ctrl);
    const names = tools.map(t => t.name).sort();
    const expectedNames = DESKTOP_TOOLS.map(t => t.name).sort();
    expect(names).toEqual(expectedNames);
  });
});

describe('formatDesktopSnapshot', () => {
  test('formats empty snapshot', () => {
    const snap: DesktopSnapshot = {
      window: { pid: 1234, title: 'Test Window', className: 'TestClass' },
      elements: [],
      totalElements: 0,
    };
    const output = formatDesktopSnapshot(snap);
    expect(output).toContain('Window: Test Window');
    expect(output).toContain('PID: 1234');
    expect(output).toContain('no UI elements found');
  });

  test('formats snapshot with elements', () => {
    const snap: DesktopSnapshot = {
      window: { pid: 5678, title: 'Notepad', className: 'Notepad' },
      elements: [
        { id: 1, role: 'Button', name: 'Save', value: null, depth: 0, isEnabled: true },
        { id: 2, role: 'TextBox', name: 'filename', value: 'untitled.txt', depth: 1, isEnabled: true },
        { id: 3, role: 'Button', name: 'Cancel', value: null, depth: 0, isEnabled: false },
      ],
      totalElements: 3,
    };
    const output = formatDesktopSnapshot(snap);
    expect(output).toContain('Window: Notepad');
    expect(output).toContain('[1] Button "Save"');
    expect(output).toContain('[2] TextBox "filename" value="untitled.txt"');
    expect(output).toContain('[3] Button "Cancel" (disabled)');
    expect(output).toContain('3/3');
  });

  test('shows truncation message when elements exceed max', () => {
    const elements = Array.from({ length: 70 }, (_, i) => ({
      id: i + 1,
      role: 'Button',
      name: `Button ${i}`,
      value: null,
      depth: 0,
      isEnabled: true,
    }));
    const snap: DesktopSnapshot = {
      window: { pid: 1, title: 'Test', className: 'Test' },
      elements,
      totalElements: 70,
    };
    const output = formatDesktopSnapshot(snap);
    expect(output).toContain('60/70');
    expect(output).toContain('10 more elements not shown');
  });
});
