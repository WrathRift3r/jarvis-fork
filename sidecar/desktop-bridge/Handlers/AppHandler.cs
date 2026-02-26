using System.Diagnostics;
using System.Runtime.InteropServices;

namespace DesktopBridge.Handlers;

public class AppHandler
{
    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, char[] lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetClassName(IntPtr hWnd, char[] lpClassName, int nMaxCount);

    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public object LaunchApp(string executable, string args = "")
    {
        if (string.IsNullOrWhiteSpace(executable))
            throw new Exception("Executable path is required");

        // Snapshot existing visible window handles before launch
        var windowsBefore = GetVisibleWindowHandles();

        var startInfo = new ProcessStartInfo
        {
            FileName = executable,
            Arguments = args,
            UseShellExecute = true
        };

        var proc = Process.Start(startInfo);
        if (proc == null)
            throw new Exception($"Failed to start: {executable}");

        // Wait for a new window to appear (handles explorer.exe PID reuse)
        IntPtr newWindow = IntPtr.Zero;
        string title = "";
        string processName = executable;
        int pid = 0;

        for (int attempt = 0; attempt < 20; attempt++) // 20 × 250ms = 5s max
        {
            Thread.Sleep(250);

            var windowsAfter = GetVisibleWindowHandles();
            var newWindows = windowsAfter.Except(windowsBefore).ToList();

            if (newWindows.Count > 0)
            {
                // Pick the first new visible window with a title
                foreach (var hwnd in newWindows)
                {
                    var t = GetWindowTitle(hwnd);
                    if (!string.IsNullOrEmpty(t))
                    {
                        newWindow = hwnd;
                        title = t;
                        GetWindowThreadProcessId(hwnd, out uint wpid);
                        pid = (int)wpid;
                        try { processName = Process.GetProcessById(pid).ProcessName; } catch { }
                        break;
                    }
                }
                if (newWindow != IntPtr.Zero)
                    break;
            }
        }

        // Fallback: if no new window found, use the process info directly
        if (newWindow == IntPtr.Zero)
        {
            try { proc.WaitForInputIdle(3000); } catch { }
            try { proc.Refresh(); } catch { }
            try { pid = proc.Id; } catch { }
            try { processName = proc.ProcessName; } catch { }
            try { title = proc.MainWindowTitle ?? ""; } catch { }

            if (proc.HasExited)
                throw new Exception($"Process '{executable}' started but exited immediately (exit code: {proc.ExitCode})");
        }

        return new
        {
            pid,
            processName,
            title,
            started = true
        };
    }

    private static HashSet<IntPtr> GetVisibleWindowHandles()
    {
        var handles = new HashSet<IntPtr>();
        EnumWindows((hwnd, _) =>
        {
            if (IsWindowVisible(hwnd))
            {
                var t = GetWindowTitle(hwnd);
                if (!string.IsNullOrEmpty(t))
                    handles.Add(hwnd);
            }
            return true;
        }, IntPtr.Zero);
        return handles;
    }

    private static string GetWindowTitle(IntPtr hwnd)
    {
        var buf = new char[256];
        var len = GetWindowText(hwnd, buf, buf.Length);
        return len > 0 ? new string(buf, 0, len) : "";
    }

    public void CloseApp(int pid)
    {
        var proc = Process.GetProcessById(pid);
        if (!proc.CloseMainWindow())
        {
            proc.Kill();
        }
    }
}
