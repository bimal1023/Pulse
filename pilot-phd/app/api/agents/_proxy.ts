/**
 * Sends a prompt to the Pulse FastAPI backend (/run-agent) and collects the
 * full streamed response. Falls back to a stub message if the backend is
 * unreachable or not configured.
 */
import { fetchWithTimeout } from "@/lib/fetchWithTimeout";

const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://127.0.0.1:8002";
const FASTAPI_TOKEN = process.env.FASTAPI_TOKEN ?? "";

export async function runAgentPrompt(prompt: string): Promise<string> {
  if (!FASTAPI_TOKEN) {
    return `_AI backend not configured. Set \`FASTAPI_TOKEN\` in your .env.local to enable AI features._\n\n**Your prompt was:**\n\n${prompt}`;
  }

  const res = await fetchWithTimeout(`${FASTAPI_URL}/run-agent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Auth-Token": FASTAPI_TOKEN,
    },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
    timeoutMs: 30_000,
  });

  if (!res.ok) {
    throw new Error(`FastAPI responded with ${res.status}`);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let answer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const chunk = JSON.parse(line.slice(6));
        if (chunk.type === "token") answer += chunk.content;
      } catch {
        // ignore malformed SSE lines
      }
    }
  }

  return answer || "No response generated.";
}
