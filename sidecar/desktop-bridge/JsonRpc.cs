using System.Text.Json;
using System.Text.Json.Serialization;

namespace DesktopBridge;

public class JsonRpcRequest
{
    [JsonPropertyName("jsonrpc")]
    public string JsonRpc { get; set; } = "2.0";

    [JsonPropertyName("method")]
    public string Method { get; set; } = "";

    [JsonPropertyName("params")]
    public JsonElement? Params { get; set; }

    [JsonPropertyName("id")]
    public int Id { get; set; }

    public T GetParam<T>(string name, T defaultValue = default!)
    {
        if (Params == null || Params.Value.ValueKind != JsonValueKind.Object)
            return defaultValue;

        if (!Params.Value.TryGetProperty(name, out var prop))
            return defaultValue;

        try
        {
            return JsonSerializer.Deserialize<T>(prop.GetRawText())!;
        }
        catch
        {
            return defaultValue;
        }
    }
}

public class JsonRpcResponse
{
    [JsonPropertyName("jsonrpc")]
    public string JsonRpc { get; set; } = "2.0";

    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("result")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public object? Result { get; set; }

    [JsonPropertyName("error")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public JsonRpcError? Error { get; set; }

    public static JsonRpcResponse Success(int id, object? result) => new()
    {
        Id = id,
        Result = result
    };

    public static JsonRpcResponse Fail(int id, int code, string message) => new()
    {
        Id = id,
        Error = new JsonRpcError { Code = code, Message = message }
    };
}

public class JsonRpcError
{
    [JsonPropertyName("code")]
    public int Code { get; set; }

    [JsonPropertyName("message")]
    public string Message { get; set; } = "";
}

public static class JsonRpcSerializer
{
    private static readonly JsonSerializerOptions Options = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        WriteIndented = false
    };

    public static JsonRpcRequest? ParseRequest(string line)
    {
        try
        {
            return JsonSerializer.Deserialize<JsonRpcRequest>(line, Options);
        }
        catch
        {
            return null;
        }
    }

    public static string Serialize(JsonRpcResponse response)
    {
        return JsonSerializer.Serialize(response, Options);
    }
}
