import type { AppController, WindowInfo, UIElement } from './interface.ts';
import { DesktopController } from './desktop-controller.ts';

/**
 * Windows App Controller — delegates to DesktopController sidecar.
 * Used when running natively on Windows (not WSL).
 */
export class WindowsAppController implements AppController {
  private controller = new DesktopController();

  async getActiveWindow(): Promise<WindowInfo> {
    return this.controller.getActiveWindow();
  }

  async getWindowTree(pid: number): Promise<UIElement[]> {
    return this.controller.getWindowTree(pid);
  }

  async listWindows(): Promise<WindowInfo[]> {
    return this.controller.listWindows();
  }

  async clickElement(element: UIElement): Promise<void> {
    return this.controller.clickElement(element);
  }

  async typeText(text: string): Promise<void> {
    return this.controller.typeText(text);
  }

  async pressKeys(keys: string[]): Promise<void> {
    return this.controller.pressKeys(keys);
  }

  async captureScreen(): Promise<Buffer> {
    return this.controller.captureScreen();
  }

  async captureWindow(pid: number): Promise<Buffer> {
    return this.controller.captureWindow(pid);
  }

  async focusWindow(pid: number): Promise<void> {
    return this.controller.focusWindow(pid);
  }
}
