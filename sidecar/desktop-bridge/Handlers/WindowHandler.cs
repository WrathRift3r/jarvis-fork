using System.Diagnostics;
using System.Runtime.InteropServices;
using FlaUI.Core.AutomationElements;
using FlaUI.UIA3;

namespace DesktopBridge.Handlers;

public class WindowHandler
{
    private readonly UIA3Automation _automation;

    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    private const int SW_RESTORE = 9;

    public WindowHandler(UIA3Automation automation)
    {
        _automation = automation;
    }

    public List<object> ListWindows()
    {
        var desktop = _automation.GetDesktop();
        var windows = desktop.FindAllChildren(cf => cf.ByControlType(FlaUI.Core.Definitions.ControlType.Window));
        var result = new List<object>();

        foreach (var win in windows)
        {
            try
            {
                var info = WindowToInfo(win);
                if (info != null)
                    result.Add(info);
            }
            catch
            {
                // Skip windows we can't inspect
            }
        }

        return result;
    }

    public object? GetActiveWindow()
    {
        var hwnd = GetForegroundWindow();
        if (hwnd == IntPtr.Zero)
            return null;

        GetWindowThreadProcessId(hwnd, out uint pid);

        try
        {
            var proc = Process.GetProcessById((int)pid);
            var element = _automation.FromHandle(hwnd);
            if (element == null)
                return null;

            return new
            {
                pid = (int)pid,
                title = element.Name ?? "",
                className = element.ClassName ?? "",
                bounds = GetBounds(element),
                focused = true,
                processName = proc.ProcessName
            };
        }
        catch
        {
            return null;
        }
    }

    public void FocusWindow(int pid)
    {
        // Find the main visible window for this PID using UIA (proc.MainWindowHandle is unreliable)
        var desktop = _automation.GetDesktop();
        var windows = desktop.FindAllChildren(cf => cf.ByControlType(FlaUI.Core.Definitions.ControlType.Window));

        IntPtr bestHandle = IntPtr.Zero;
        double bestArea = 0;

        foreach (var win in windows)
        {
            try
            {
                if (win.Properties.ProcessId.Value != pid) continue;
                var name = win.Name;
                if (string.IsNullOrEmpty(name)) continue;

                var rect = win.BoundingRectangle;
                var area = rect.Width * rect.Height;
                if (area > bestArea)
                {
                    bestArea = area;
                    bestHandle = win.Properties.NativeWindowHandle.Value;
                }
            }
            catch { }
        }

        // Fallback to Process.MainWindowHandle
        if (bestHandle == IntPtr.Zero)
        {
            var proc = Process.GetProcessById(pid);
            bestHandle = proc.MainWindowHandle;
        }

        if (bestHandle == IntPtr.Zero)
            throw new Exception($"No visible window found for PID {pid}");

        ShowWindow(bestHandle, SW_RESTORE);
        SetForegroundWindow(bestHandle);
    }

    public void CloseWindow(int pid)
    {
        var proc = Process.GetProcessById(pid);
        proc.CloseMainWindow();
    }

    private object? WindowToInfo(AutomationElement win)
    {
        var name = win.Name;
        if (string.IsNullOrEmpty(name))
            return null;

        int pid = 0;
        try
        {
            pid = win.Properties.ProcessId.Value;
        }
        catch
        {
            return null;
        }

        // Skip our own process
        if (pid == Environment.ProcessId)
            return null;

        var hwnd = GetForegroundWindow();
        GetWindowThreadProcessId(hwnd, out uint fgPid);

        string processName = "";
        try
        {
            processName = Process.GetProcessById(pid).ProcessName;
        }
        catch { }

        return new
        {
            pid,
            title = name,
            className = win.ClassName ?? "",
            bounds = GetBounds(win),
            focused = pid == (int)fgPid,
            processName
        };
    }

    private static object GetBounds(AutomationElement el)
    {
        try
        {
            var rect = el.BoundingRectangle;
            return new { x = (int)rect.X, y = (int)rect.Y, width = (int)rect.Width, height = (int)rect.Height };
        }
        catch
        {
            return new { x = 0, y = 0, width = 0, height = 0 };
        }
    }
}
