using System.Diagnostics;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

namespace DesktopBridge.Handlers;

public class ScreenHandler
{
    [DllImport("user32.dll")]
    private static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);

    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

    [DllImport("user32.dll")]
    private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

    [DllImport("user32.dll")]
    private static extern bool IsWindowVisible(IntPtr hWnd);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, char[] lpString, int nMaxCount);

    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [StructLayout(LayoutKind.Sequential)]
    private struct RECT
    {
        public int Left, Top, Right, Bottom;
    }

    public string CaptureScreen()
    {
        // Capture all monitors (virtual screen) not just primary
        var bounds = System.Windows.Forms.SystemInformation.VirtualScreen;
        using var bmp = new Bitmap(bounds.Width, bounds.Height);
        using var g = Graphics.FromImage(bmp);
        g.CopyFromScreen(bounds.Location, Point.Empty, bounds.Size);
        return BitmapToBase64(bmp);
    }

    public string CaptureWindow(int pid)
    {
        // Find the main visible window for this PID (handles explorer.exe etc.)
        var hwnd = FindMainWindowForPid(pid);
        if (hwnd == IntPtr.Zero)
            throw new Exception($"No visible window found for PID {pid}");

        if (!GetWindowRect(hwnd, out var rect))
            throw new Exception("Failed to get window rectangle");

        var width = rect.Right - rect.Left;
        var height = rect.Bottom - rect.Top;

        if (width <= 0 || height <= 0)
            throw new Exception("Window has zero size");

        using var bmp = new Bitmap(width, height);
        using var g = Graphics.FromImage(bmp);
        g.CopyFromScreen(new Point(rect.Left, rect.Top), Point.Empty, new Size(width, height));
        return BitmapToBase64(bmp);
    }

    private static IntPtr FindMainWindowForPid(int pid)
    {
        IntPtr bestHandle = IntPtr.Zero;
        long bestArea = 0;

        EnumWindows((hwnd, _) =>
        {
            if (!IsWindowVisible(hwnd)) return true;

            GetWindowThreadProcessId(hwnd, out uint wpid);
            if ((int)wpid != pid) return true;

            // Check it has a title
            var buf = new char[256];
            var len = GetWindowText(hwnd, buf, buf.Length);
            if (len <= 0) return true;

            // Pick the largest window
            if (GetWindowRect(hwnd, out var rect))
            {
                long area = (long)(rect.Right - rect.Left) * (rect.Bottom - rect.Top);
                if (area > bestArea)
                {
                    bestArea = area;
                    bestHandle = hwnd;
                }
            }

            return true;
        }, IntPtr.Zero);

        // Fallback to Process.MainWindowHandle
        if (bestHandle == IntPtr.Zero)
        {
            try
            {
                var proc = Process.GetProcessById(pid);
                bestHandle = proc.MainWindowHandle;
            }
            catch { }
        }

        return bestHandle;
    }

    private static string BitmapToBase64(Bitmap bmp)
    {
        using var ms = new MemoryStream();
        bmp.Save(ms, ImageFormat.Png);
        return Convert.ToBase64String(ms.ToArray());
    }
}
