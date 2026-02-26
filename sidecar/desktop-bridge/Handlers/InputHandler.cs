using System.Runtime.InteropServices;
using FlaUI.Core.Input;
using FlaUI.Core.WindowsAPI;

namespace DesktopBridge.Handlers;

public class InputHandler
{
    [DllImport("user32.dll")]
    private static extern IntPtr GetForegroundWindow();

    [DllImport("user32.dll")]
    private static extern bool SetForegroundWindow(IntPtr hWnd);

    private static readonly Dictionary<string, VirtualKeyShort> KeyMap = new(StringComparer.OrdinalIgnoreCase)
    {
        // Modifiers
        ["ctrl"] = VirtualKeyShort.CONTROL,
        ["control"] = VirtualKeyShort.CONTROL,
        ["alt"] = VirtualKeyShort.LMENU,
        ["shift"] = VirtualKeyShort.SHIFT,
        ["win"] = VirtualKeyShort.LWIN,
        ["meta"] = VirtualKeyShort.LWIN,
        ["super"] = VirtualKeyShort.LWIN,

        // Navigation
        ["enter"] = VirtualKeyShort.RETURN,
        ["return"] = VirtualKeyShort.RETURN,
        ["tab"] = VirtualKeyShort.TAB,
        ["escape"] = VirtualKeyShort.ESCAPE,
        ["esc"] = VirtualKeyShort.ESCAPE,
        ["backspace"] = VirtualKeyShort.BACK,
        ["delete"] = VirtualKeyShort.DELETE,
        ["del"] = VirtualKeyShort.DELETE,
        ["insert"] = VirtualKeyShort.INSERT,
        ["home"] = VirtualKeyShort.HOME,
        ["end"] = VirtualKeyShort.END,
        ["pageup"] = VirtualKeyShort.PRIOR,
        ["pagedown"] = VirtualKeyShort.NEXT,
        ["space"] = VirtualKeyShort.SPACE,

        // Arrow keys
        ["up"] = VirtualKeyShort.UP,
        ["down"] = VirtualKeyShort.DOWN,
        ["left"] = VirtualKeyShort.LEFT,
        ["right"] = VirtualKeyShort.RIGHT,

        // Function keys
        ["f1"] = VirtualKeyShort.F1,
        ["f2"] = VirtualKeyShort.F2,
        ["f3"] = VirtualKeyShort.F3,
        ["f4"] = VirtualKeyShort.F4,
        ["f5"] = VirtualKeyShort.F5,
        ["f6"] = VirtualKeyShort.F6,
        ["f7"] = VirtualKeyShort.F7,
        ["f8"] = VirtualKeyShort.F8,
        ["f9"] = VirtualKeyShort.F9,
        ["f10"] = VirtualKeyShort.F10,
        ["f11"] = VirtualKeyShort.F11,
        ["f12"] = VirtualKeyShort.F12,

        // Common keys
        ["a"] = VirtualKeyShort.KEY_A, ["b"] = VirtualKeyShort.KEY_B,
        ["c"] = VirtualKeyShort.KEY_C, ["d"] = VirtualKeyShort.KEY_D,
        ["e"] = VirtualKeyShort.KEY_E, ["f"] = VirtualKeyShort.KEY_F,
        ["g"] = VirtualKeyShort.KEY_G, ["h"] = VirtualKeyShort.KEY_H,
        ["i"] = VirtualKeyShort.KEY_I, ["j"] = VirtualKeyShort.KEY_J,
        ["k"] = VirtualKeyShort.KEY_K, ["l"] = VirtualKeyShort.KEY_L,
        ["m"] = VirtualKeyShort.KEY_M, ["n"] = VirtualKeyShort.KEY_N,
        ["o"] = VirtualKeyShort.KEY_O, ["p"] = VirtualKeyShort.KEY_P,
        ["q"] = VirtualKeyShort.KEY_Q, ["r"] = VirtualKeyShort.KEY_R,
        ["s"] = VirtualKeyShort.KEY_S, ["t"] = VirtualKeyShort.KEY_T,
        ["u"] = VirtualKeyShort.KEY_U, ["v"] = VirtualKeyShort.KEY_V,
        ["w"] = VirtualKeyShort.KEY_W, ["x"] = VirtualKeyShort.KEY_X,
        ["y"] = VirtualKeyShort.KEY_Y, ["z"] = VirtualKeyShort.KEY_Z,

        // Numbers
        ["0"] = VirtualKeyShort.KEY_0, ["1"] = VirtualKeyShort.KEY_1,
        ["2"] = VirtualKeyShort.KEY_2, ["3"] = VirtualKeyShort.KEY_3,
        ["4"] = VirtualKeyShort.KEY_4, ["5"] = VirtualKeyShort.KEY_5,
        ["6"] = VirtualKeyShort.KEY_6, ["7"] = VirtualKeyShort.KEY_7,
        ["8"] = VirtualKeyShort.KEY_8, ["9"] = VirtualKeyShort.KEY_9,
    };

    [DllImport("user32.dll")]
    private static extern bool OpenClipboard(IntPtr hWndNewOwner);

    [DllImport("user32.dll")]
    private static extern bool CloseClipboard();

    [DllImport("user32.dll")]
    private static extern bool EmptyClipboard();

    [DllImport("user32.dll")]
    private static extern IntPtr SetClipboardData(uint uFormat, IntPtr hMem);

    [DllImport("kernel32.dll")]
    private static extern IntPtr GlobalAlloc(uint uFlags, UIntPtr dwBytes);

    [DllImport("kernel32.dll")]
    private static extern IntPtr GlobalLock(IntPtr hMem);

    [DllImport("kernel32.dll")]
    private static extern bool GlobalUnlock(IntPtr hMem);

    private const uint CF_UNICODETEXT = 13;
    private const uint GMEM_MOVEABLE = 0x0002;

    public void TypeText(string text)
    {
        if (string.IsNullOrEmpty(text))
            return;

        // Use clipboard paste for reliability — Keyboard.Type() can drop characters
        SetClipboardText(text);
        Thread.Sleep(50);

        // Ctrl+V to paste
        Keyboard.Press(VirtualKeyShort.CONTROL);
        Keyboard.Press(VirtualKeyShort.KEY_V);
        Keyboard.Release(VirtualKeyShort.KEY_V);
        Keyboard.Release(VirtualKeyShort.CONTROL);

        Thread.Sleep(50);
    }

    private static void SetClipboardText(string text)
    {
        if (!OpenClipboard(IntPtr.Zero))
            throw new Exception("Failed to open clipboard");

        try
        {
            EmptyClipboard();
            var bytes = (text.Length + 1) * 2; // UTF-16 + null terminator
            var hMem = GlobalAlloc(GMEM_MOVEABLE, (UIntPtr)bytes);
            if (hMem == IntPtr.Zero)
                throw new Exception("Failed to allocate clipboard memory");

            var ptr = GlobalLock(hMem);
            Marshal.Copy(text.ToCharArray(), 0, ptr, text.Length);
            Marshal.WriteInt16(ptr, text.Length * 2, 0); // null terminator
            GlobalUnlock(hMem);

            SetClipboardData(CF_UNICODETEXT, hMem);
        }
        finally
        {
            CloseClipboard();
        }
    }

    public void PressKeys(string[] keys)
    {
        if (keys.Length == 0)
            return;

        // Resolve all keys
        var virtualKeys = new List<VirtualKeyShort>();
        foreach (var key in keys)
        {
            if (KeyMap.TryGetValue(key, out var vk))
            {
                virtualKeys.Add(vk);
            }
            else if (key.Length == 1)
            {
                // Single character — try to map it
                var upper = key.ToUpperInvariant();
                if (KeyMap.TryGetValue(upper, out var vk2))
                    virtualKeys.Add(vk2);
                else
                    throw new Exception($"Unknown key: {key}");
            }
            else
            {
                throw new Exception($"Unknown key: {key}");
            }
        }

        if (virtualKeys.Count == 1)
        {
            Keyboard.Press(virtualKeys[0]);
            Keyboard.Release(virtualKeys[0]);
        }
        else
        {
            // Press modifiers, then the last key, then release all
            var modifiers = virtualKeys.Take(virtualKeys.Count - 1).ToArray();
            var mainKey = virtualKeys.Last();

            foreach (var mod in modifiers)
                Keyboard.Press(mod);

            Keyboard.Press(mainKey);
            Keyboard.Release(mainKey);

            foreach (var mod in modifiers.Reverse())
                Keyboard.Release(mod);
        }
    }
}
