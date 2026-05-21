import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");

const readEnv = async () => {
  const out = {};
  if (!existsSync(envPath)) return out;
  const raw = await readFile(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 0) continue;
    out[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
  return out;
};

const json = (res, code, body) => {
  res.writeHead(code, {
    "content-type": "application/json",
    "access-control-allow-origin": "http://127.0.0.1:5190",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
  });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolveBody, reject) => {
    let raw = "";
    req.on("data", (chunk) => { raw += chunk; });
    req.on("end", () => {
      try {
        resolveBody(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    json(res, 204, {});
    return;
  }

  if (req.url === "/health") {
    const env = await readEnv();
    json(res, 200, {
      ok: true,
      providerId: env.AGENT_PROVIDER_ID ?? "mock",
      modelId: env.AGENT_MODEL_ID ?? "mock-planner",
      apiKeyStatus: env.AGENT_API_KEY ? "configured" : "missing",
    });
    return;
  }

  if (req.url === "/v1/agent/run" && req.method === "POST") {
    const env = await readEnv();
    const body = await readBody(req);
    json(res, 200, {
      providerId: env.AGENT_PROVIDER_ID ?? "mock",
      modelId: env.AGENT_MODEL_ID ?? "mock-planner",
      mode: "bridge-stub",
      message: "Bridge is reachable. Frontend still uses the in-app mock provider until an OpenAI-compatible provider adapter is enabled.",
      prompt: body.prompt ?? null,
    });
    return;
  }

  json(res, 404, { error: "not_found" });
});

const port = Number(process.env.AGENT_BRIDGE_PORT ?? 8787);
server.listen(port, "127.0.0.1", () => {
  console.log(`agent bridge listening on http://127.0.0.1:${port}`);
});
