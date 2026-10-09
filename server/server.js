import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createWebSocketHub } from './websocket.js';
import { TikTokConnector } from './tiktok/TikTokConnector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, '..');
const port = Number(process.env.PORT) || 8080;
const websocketTestEnabled = process.argv.includes('--ws-test');
let websocketTestInterval = null;

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
};

async function serveStatic(request, response) {
  try {
    const requestUrl = new URL(
      request.url,
      `http://${request.headers.host ?? 'localhost'}`
    );
    const pathname = decodeURIComponent(requestUrl.pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    let filePath = resolve(projectRoot, relativePath);

    if (
      filePath !== projectRoot &&
      !filePath.startsWith(`${projectRoot}${sep}`)
    ) {
      response.writeHead(403);
      response.end('Forbidden');
      return;
    }

    const fileStat = await stat(filePath);

    if (fileStat.isDirectory()) {
      filePath = resolve(filePath, 'index.html');
    }

    const content = await readFile(filePath);
    const contentType = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream';

    response.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-store'
    });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
}

const httpServer = createServer(serveStatic);
const websocketHub = createWebSocketHub(httpServer);

function forwardEvent(event) {
  const delivered = websocketHub.broadcast(event);
  console.log(
    `[EVENT] ${event.type} ${event.username} -> ${delivered} cliente(s)`
  );
}

function logTikTokConnectionError(error) {
  console.error('[TIKTOK] Não foi possível conectar:', error?.message ?? error);

  const nestedErrors = [
    ...(Array.isArray(error?.requestErrs) ? error.requestErrs : []),
    ...(Array.isArray(error?.errors) ? error.errors : []),
    error?.cause
  ].filter(Boolean);

  const seenMessages = new Set();

  nestedErrors.forEach((nestedError, index) => {
    const message = String(nestedError?.message ?? nestedError).trim();

    if (!message || seenMessages.has(message)) {
      return;
    }

    seenMessages.add(message);
    console.error(`[TIKTOK][DIAG ${index + 1}] ${message}`);
  });

  if (nestedErrors.length === 0) {
    console.error(
      '[TIKTOK][DIAG] O conector não expôs detalhes adicionais para esta falha.'
    );
  }
}

const tiktokUsername = String(process.env.TIKTOK_USERNAME ?? '').trim();
const tiktokConnector = tiktokUsername
  ? new TikTokConnector({ username: tiktokUsername, onEvent: forwardEvent })
  : null;

httpServer.listen(port, async () => {
  console.log(`[SERVER] Live Arena em http://localhost:${port}`);
  console.log(`[WS] WebSocket em ws://localhost:${port}/events`);

  if (websocketTestEnabled) {
    console.log('[WS TEST] Enviando COMMENT de teste a cada 3 segundos.');
    websocketTestInterval = setInterval(() => {
      forwardEvent({
        type: 'COMMENT',
        userId: 'ws-test-001',
        username: '@WebSocketTest',
        timestamp: Date.now(),
        message: 'WebSocket OK'
      });
    }, 3000);
  }

  if (!tiktokConnector) {
    console.log('[TIKTOK] Desativado. Use npm run start:live após configurar .env.');
    return;
  }

  try {
    console.log(`[TIKTOK] Conectando a ${tiktokUsername}...`);
    await tiktokConnector.connect();
  } catch (error) {
    logTikTokConnectionError(error);
    console.log('[SERVER] O jogo continuará disponível localmente.');
  }
});

function shutdown() {
  if (websocketTestInterval) {
    clearInterval(websocketTestInterval);
  }

  tiktokConnector?.disconnect();
  websocketHub.close();
  httpServer.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
