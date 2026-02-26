using System.Net;
using System.Net.Sockets;
using System.Text;
using DesktopBridge;
using DesktopBridge.Handlers;

int port = 9224;

// Parse --port argument
for (int i = 0; i < args.Length; i++)
{
    if (args[i] == "--port" && i + 1 < args.Length)
    {
        port = int.Parse(args[i + 1]);
        i++;
    }
}

var automation = new FlaUI.UIA3.UIA3Automation();
var windowHandler = new WindowHandler(automation);
var elementHandler = new ElementHandler(automation);
var inputHandler = new InputHandler();
var screenHandler = new ScreenHandler();
var appHandler = new AppHandler();

var listener = new TcpListener(IPAddress.Any, port);
listener.Start();
Console.WriteLine($"[DesktopBridge] Listening on port {port}");

var cts = new CancellationTokenSource();

// Handle each client connection
while (!cts.IsCancellationRequested)
{
    TcpClient client;
    try
    {
        client = await listener.AcceptTcpClientAsync(cts.Token);
    }
    catch (OperationCanceledException)
    {
        break;
    }

    // Handle client in background
    _ = Task.Run(async () =>
    {
        using var c = client;
        var stream = c.GetStream();
        var utf8NoBom = new UTF8Encoding(false);
        var reader = new StreamReader(stream, utf8NoBom);
        var writer = new StreamWriter(stream, utf8NoBom) { AutoFlush = true };

        while (c.Connected && !cts.IsCancellationRequested)
        {
            string? line;
            try
            {
                line = await reader.ReadLineAsync();
            }
            catch
            {
                break;
            }

            if (line == null) break;
            if (string.IsNullOrWhiteSpace(line)) continue;

            var request = JsonRpcSerializer.ParseRequest(line);
            if (request == null)
            {
                await writer.WriteLineAsync(
                    JsonRpcSerializer.Serialize(JsonRpcResponse.Fail(0, -32700, "Parse error")));
                continue;
            }

            JsonRpcResponse response;
            try
            {
                response = await Dispatch(request);
            }
            catch (Exception ex)
            {
                response = JsonRpcResponse.Fail(request.Id, -32603, ex.Message);
            }

            await writer.WriteLineAsync(JsonRpcSerializer.Serialize(response));
        }
    });
}

listener.Stop();
automation.Dispose();

async Task<JsonRpcResponse> Dispatch(JsonRpcRequest req)
{
    return req.Method switch
    {
        "ping" => JsonRpcResponse.Success(req.Id, "pong"),
        "shutdown" => Shutdown(req),

        // Window operations
        "listWindows" => JsonRpcResponse.Success(req.Id, windowHandler.ListWindows()),
        "getActiveWindow" => JsonRpcResponse.Success(req.Id, windowHandler.GetActiveWindow()),
        "focusWindow" => await FocusWindow(req),
        "closeWindow" => await CloseWindow(req),

        // Element operations
        "getWindowTree" => GetWindowTree(req),
        "clickElement" => ClickElement(req),
        "dragElement" => DragElement(req),

        // Input operations
        "typeText" => TypeText(req),
        "pressKeys" => PressKeys(req),

        // Screen operations
        "captureScreen" => JsonRpcResponse.Success(req.Id, screenHandler.CaptureScreen()),
        "captureWindow" => CaptureWindow(req),

        // App operations
        "launchApp" => LaunchApp(req),
        "closeApp" => CloseApp(req),

        _ => JsonRpcResponse.Fail(req.Id, -32601, $"Method not found: {req.Method}")
    };
}

JsonRpcResponse Shutdown(JsonRpcRequest req)
{
    cts.Cancel();
    return JsonRpcResponse.Success(req.Id, "shutting down");
}

async Task<JsonRpcResponse> FocusWindow(JsonRpcRequest req)
{
    var pid = req.GetParam<int>("pid");
    windowHandler.FocusWindow(pid);
    return JsonRpcResponse.Success(req.Id, "focused");
}

async Task<JsonRpcResponse> CloseWindow(JsonRpcRequest req)
{
    var pid = req.GetParam<int>("pid");
    windowHandler.CloseWindow(pid);
    return JsonRpcResponse.Success(req.Id, "closed");
}

JsonRpcResponse GetWindowTree(JsonRpcRequest req)
{
    var pid = req.GetParam<int>("pid");
    var depth = req.GetParam<int>("depth", 5);
    var tree = elementHandler.GetWindowTree(pid, depth);
    return JsonRpcResponse.Success(req.Id, tree);
}

JsonRpcResponse ClickElement(JsonRpcRequest req)
{
    var elementId = req.GetParam<int>("elementId");
    elementHandler.ClickElement(elementId);
    return JsonRpcResponse.Success(req.Id, "clicked");
}

JsonRpcResponse DragElement(JsonRpcRequest req)
{
    var fromId = req.GetParam<int>("fromId");
    var toId = req.GetParam<int>("toId");
    elementHandler.DragElement(fromId, toId);
    return JsonRpcResponse.Success(req.Id, "dragged");
}

JsonRpcResponse TypeText(JsonRpcRequest req)
{
    var text = req.GetParam<string>("text", "");
    inputHandler.TypeText(text);
    return JsonRpcResponse.Success(req.Id, "typed");
}

JsonRpcResponse PressKeys(JsonRpcRequest req)
{
    var keys = req.GetParam<string[]>("keys", Array.Empty<string>());
    inputHandler.PressKeys(keys);
    return JsonRpcResponse.Success(req.Id, "pressed");
}

JsonRpcResponse CaptureWindow(JsonRpcRequest req)
{
    var pid = req.GetParam<int>("pid");
    var base64 = screenHandler.CaptureWindow(pid);
    return JsonRpcResponse.Success(req.Id, base64);
}

JsonRpcResponse LaunchApp(JsonRpcRequest req)
{
    var executable = req.GetParam<string>("executable", "");
    var args = req.GetParam<string>("args", "");
    var info = appHandler.LaunchApp(executable, args);
    return JsonRpcResponse.Success(req.Id, info);
}

JsonRpcResponse CloseApp(JsonRpcRequest req)
{
    var pid = req.GetParam<int>("pid");
    appHandler.CloseApp(pid);
    return JsonRpcResponse.Success(req.Id, "closed");
}
