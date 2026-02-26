using System.Diagnostics;
using FlaUI.Core;
using FlaUI.Core.AutomationElements;
using FlaUI.Core.Input;
using FlaUI.UIA3;

namespace DesktopBridge.Handlers;

public class ElementHandler
{
    private readonly UIA3Automation _automation;
    private readonly Dictionary<int, AutomationElement> _elementCache = new();
    private int _nextId;

    public ElementHandler(UIA3Automation automation)
    {
        _automation = automation;
    }

    public object GetWindowTree(int pid, int maxDepth = 5)
    {
        // Clear cache for new snapshot
        _elementCache.Clear();
        _nextId = 1;

        // Find the best window for this PID using FlaUI
        // (proc.MainWindowHandle is unreliable for explorer.exe and other multi-window apps)
        var root = FindMainWindowForPid(pid);
        if (root == null)
            throw new Exception($"No visible window found for PID {pid}");

        var tree = WalkTree(root, 0, maxDepth);
        return new
        {
            window = new
            {
                pid,
                title = root.Name ?? "",
                className = root.ClassName ?? ""
            },
            elements = tree,
            totalCached = _elementCache.Count
        };
    }

    private AutomationElement? FindMainWindowForPid(int pid)
    {
        var desktop = _automation.GetDesktop();
        var windows = desktop.FindAllChildren(cf => cf.ByControlType(FlaUI.Core.Definitions.ControlType.Window));

        AutomationElement? best = null;
        double bestArea = 0;

        foreach (var win in windows)
        {
            try
            {
                if (win.Properties.ProcessId.Value != pid)
                    continue;

                var name = win.Name;
                if (string.IsNullOrEmpty(name))
                    continue;

                // Pick the largest visible window for this PID
                var rect = win.BoundingRectangle;
                var area = rect.Width * rect.Height;
                if (area > bestArea)
                {
                    bestArea = area;
                    best = win;
                }
            }
            catch
            {
                // Skip inaccessible windows
            }
        }

        // Fallback to proc.MainWindowHandle
        if (best == null)
        {
            try
            {
                var proc = Process.GetProcessById(pid);
                var hwnd = proc.MainWindowHandle;
                if (hwnd != IntPtr.Zero)
                    best = _automation.FromHandle(hwnd);
            }
            catch { }
        }

        return best;
    }

    public void ClickElement(int elementId)
    {
        if (!_elementCache.TryGetValue(elementId, out var element))
            throw new Exception($"Element {elementId} not found in cache. Take a new snapshot first.");

        try
        {
            var rect = element.BoundingRectangle;
            var centerX = (int)(rect.X + rect.Width / 2);
            var centerY = (int)(rect.Y + rect.Height / 2);
            Mouse.Click(new System.Drawing.Point(centerX, centerY));
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to click element {elementId}: {ex.Message}");
        }
    }

    public void DragElement(int fromId, int toId)
    {
        if (!_elementCache.TryGetValue(fromId, out var fromEl))
            throw new Exception($"Source element {fromId} not found in cache.");
        if (!_elementCache.TryGetValue(toId, out var toEl))
            throw new Exception($"Target element {toId} not found in cache.");

        var fromRect = fromEl.BoundingRectangle;
        var toRect = toEl.BoundingRectangle;

        var fromPoint = new System.Drawing.Point(
            (int)(fromRect.X + fromRect.Width / 2),
            (int)(fromRect.Y + fromRect.Height / 2));
        var toPoint = new System.Drawing.Point(
            (int)(toRect.X + toRect.Width / 2),
            (int)(toRect.Y + toRect.Height / 2));

        Mouse.Drag(fromPoint, toPoint);
    }

    private List<object> WalkTree(AutomationElement element, int depth, int maxDepth)
    {
        var results = new List<object>();

        if (depth >= maxDepth)
            return results;

        AutomationElement[] children;
        try
        {
            children = element.FindAllChildren();
        }
        catch
        {
            return results;
        }

        foreach (var child in children)
        {
            try
            {
                var id = _nextId++;
                _elementCache[id] = child;

                string? value = null;
                try
                {
                    if (child.Patterns.Value.IsSupported)
                        value = child.Patterns.Value.Pattern.Value.Value;
                }
                catch { }

                bool isEnabled = true;
                try
                {
                    isEnabled = child.IsEnabled;
                }
                catch { }

                var rect = GetBounds(child);
                var childElements = WalkTree(child, depth + 1, maxDepth);

                results.Add(new
                {
                    id,
                    role = child.ControlType.ToString(),
                    name = child.Name ?? "",
                    value,
                    bounds = rect,
                    isEnabled,
                    children = childElements.Count > 0 ? childElements : null,
                    properties = new
                    {
                        automationId = child.AutomationId ?? "",
                        className = child.ClassName ?? "",
                        helpText = GetHelpText(child)
                    }
                });

                // Cap total elements to prevent memory issues
                if (_elementCache.Count > 500)
                    return results;
            }
            catch
            {
                // Skip elements we can't inspect
            }
        }

        return results;
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

    private static string GetHelpText(AutomationElement el)
    {
        try
        {
            return el.Properties.HelpText.ValueOrDefault ?? "";
        }
        catch
        {
            return "";
        }
    }
}
