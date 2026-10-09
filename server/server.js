import { createServer } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { dirname, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createWebSocketHub } from "./websocket.js";
import { TikTokConnector } from "./tiktok/TikTokConnector.js";
import { EventGateway } from "./websocket/EventGateway.js";
import { getServerConfig } from "./config/ServerConfig.js";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = getServerConfig();
let status = {
  state: "DISCONNECTED",
  mode: config.websocketTest
    ? "WS_TEST"
    : config.username
      ? "LIVE"
      : "SIMULATOR",
  username: config.username ? `@${config.username}` : "",
};
const getStatus = () => ({
  ...status,
  viewers: gateway.registry.size,
  acceptedEvents: gateway.accepted,
});
const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
const httpServer = createServer(async (request, response) => {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Cache-Control", "no-store");
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405);
    response.end();
    return;
  }
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (pathname === "/api/status") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        request.method === "HEAD" ? "" : JSON.stringify(getStatus()),
      );
      return;
    }
    const allowed =
      pathname === "/" ||
      pathname === "/index.html" ||
      pathname === "/style.css" ||
      /^\/game\/[\w/.-]+\.js$/.test(pathname) ||
      pathname === "/node_modules/phaser/dist/phaser.min.js";
    if (
      !allowed ||
      pathname.split("/").some((part) => part === ".." || part === ".")
    )
      throw new Error("Not a public asset");
    const file = await realpath(
      resolve(projectRoot, pathname === "/" ? "index.html" : pathname.slice(1)),
    );
    if (!file.startsWith(projectRoot + sep))
      throw new Error("Outside public root");
    const content = await readFile(file);
    response.writeHead(200, {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
    });
    response.end(request.method === "HEAD" ? "" : content);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});
const hub = createWebSocketHub(httpServer, getStatus);
const gateway = new EventGateway({
  broadcast: (event) => hub.broadcast(event),
});
const connector =
  config.username && !config.websocketTest
    ? new TikTokConnector({
        username: config.username,
        onEvent: (event) => gateway.publish(event),
        onStatus: (next) => {
          status = { mode: status.mode, ...next };
          hub.broadcast({ type: "STATUS", data: getStatus() });
        },
        options: process.env.TIKTOK_SIGN_API_KEY
          ? { signApiKey: process.env.TIKTOK_SIGN_API_KEY }
          : {},
      })
    : null;
let testInterval;
let testIndex = 0;
httpServer.on("error", (error) => {
  console.error(`[SERVER] ${error.message}`);
  process.exitCode = 1;
  hub.close();
});
httpServer.listen(config.port, config.host, () => {
  console.log(
    `[SERVER] Live Arena v0.09.0 em http://${config.host}:${config.port}`,
  );
  if (config.websocketTest)
    testInterval = setInterval(() => {
      const type = ["JOIN", "COMMENT", "LIKE", "FOLLOW", "SHARE", "GIFT"][
        testIndex++ % 6
      ];
      gateway.publish({
        type,
        userId: "ws-test-001",
        username: "@WebSocketTest",
        timestamp: Date.now(),
        eventId: `ws-test-${Date.now()}`,
        data: {
          message: "WebSocket OK",
          count: 20,
          giftId: "rose",
          giftName: "Rose",
          quantity: 1,
        },
      });
    }, 1000);
  if (connector) void connector.connect();
  else console.log("[SERVER] Simulador disponível; TikTok LIVE não conectado.");
});
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  clearInterval(testInterval);
  await connector?.disconnect();
  hub.close();
  httpServer.close(() => process.exit(0));
}
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
