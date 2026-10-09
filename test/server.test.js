import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import WebSocket from "ws";
test(
  "server starts, protects private files, and sends normalized events over real WebSocket",
  { timeout: 15000 },
  async (t) => {
    const probe = createServer();
    probe.listen(0, "127.0.0.1");
    await once(probe, "listening");
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const child = spawn(process.execPath, ["server/server.js", "--ws-test"], {
      cwd: new URL("..", import.meta.url),
      env: { ...process.env, PORT: String(port), TIKTOK_USERNAME: "" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let logs = "";
    child.stdout.on("data", (data) => {
      logs += data;
    });
    child.stderr.on("data", (data) => {
      logs += data;
    });
    t.after(async () => {
      if (child.exitCode === null) {
        child.kill("SIGTERM");
        await once(child, "exit");
      }
    });
    const base = `http://127.0.0.1:${port}`;
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (child.exitCode !== null) throw new Error(logs);
      try {
        const response = await fetch(base + "/api/status");
        if (response.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    assert.ok(ready, logs);
    assert.match(await (await fetch(base)).text(), /Live Arena/);
    for (const path of [
      "/.env",
      "/.git/config",
      "/server/server.js",
      "/package.json",
      "/game/%2e%2e%2fserver/server.js",
    ]) {
      assert.equal((await fetch(base + path)).status, 404, path);
    }
    const socket = new WebSocket(`ws://127.0.0.1:${port}/events`);
    t.after(() => socket.terminate());
    const received = [];
    const complete = new Promise((resolve, reject) => {
      socket.on("error", reject);
      socket.on("message", (raw) => {
        const value = JSON.parse(raw);
        received.push(value);
        if (received.filter((e) => e.type !== "STATUS").length === 6) resolve();
      });
    });
    await complete;
    assert.equal(received[0].type, "STATUS");
    assert.equal(received[0].data.mode, "WS_TEST");
    const events = received.filter((e) => e.type !== "STATUS");
    assert.deepEqual(
      new Set(events.map((e) => e.type)),
      new Set(["JOIN", "COMMENT", "LIKE", "FOLLOW", "SHARE", "GIFT"]),
    );
    assert.ok(
      events.every((e) => e.userId === "ws-test-001" && e.data && e.eventId),
    );
    assert.equal(events.find((e) => e.type === "GIFT").data.quantity, 1);
    const state = await (await fetch(base + "/api/status")).json();
    assert.equal(state.viewers, 1);
    socket.close();
  },
);
