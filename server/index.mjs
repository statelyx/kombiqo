import { createServer } from 'node:http';
import { createHash, randomBytes } from 'node:crypto';
import { openSync, closeSync, unlinkSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { configuredProviders } from './providers.mjs';
import { createRouter } from './router.mjs';
import { QuotaStore } from './quota.mjs';

export function createApp({ analyze, now = Date.now, origin = '' }) {
  const clients = new Map(), salt = randomBytes(32);
  let running = 0;
  return createServer(async (req, res) => {
    const send = (status, value) => { if (!res.destroyed && !res.writableEnded) { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(value)); } };
    if (origin && req.headers.origin === origin) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
    if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'POST'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); res.writeHead(204); res.end(); return; }
    if (req.url === '/health' && req.method === 'GET') { send(200, { ok: true }); return; }
    if (req.url !== '/analyze' || req.method !== 'POST') { send(404, { error: 'not-found' }); return; }
    if (req.headers.origin && req.headers.origin !== origin) { send(403, { error: 'origin' }); return; }
    if (!req.headers['content-type']?.startsWith('application/json')) { send(415, { error: 'format' }); return; }
    // Do not trust client-provided X-Forwarded-For. Behind a proxy this becomes a conservative shared limit.
    const client = createHash('sha256').update(salt).update(req.socket.remoteAddress ?? 'unknown').digest('hex');
    for (const [key, value] of clients) if (value.until < now()) clients.delete(key);
    const usage = clients.get(client) ?? { count: 0, until: now() + 86400000 };
    if (clients.size >= 2000 && !clients.has(client) || usage.count >= 5 || running >= 2) { send(200, { source: 'device', fields: {} }); return; }
    usage.count++; clients.set(client, usage); running++;
    const controller = new AbortController();
    const cancel = () => controller.abort(); res.on('close', cancel);
    const timer = setTimeout(() => { cancel(); send(200, { source: 'device', fields: {} }); req.destroy(); }, 12000);
    try {
      let size = 0; const chunks = [];
      for await (const chunk of req) { size += chunk.length; if (size > 1500000) { send(413, { error: 'image-size' }); req.destroy(); return; } chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      // No arbitrary URL fetching: prevents SSRF and limits bandwidth per request.
      if (typeof body.image !== 'string' || !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(body.image)) { send(400, { error: 'image' }); return; }
      const bytes = Buffer.from(body.image.split(',')[1], 'base64');
      if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) { send(400, { error: 'image' }); return; }
      send(200, await analyze(body.image, controller.signal));
    } catch { send(400, { error: 'request' }); }
    finally { clearTimeout(timer); res.off('close', cancel); running--; }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const quotaPath = resolve(process.env.QUOTA_FILE ?? 'server/quota.local.json');
  // Refuse another process sharing the same quota ledger.
  const lockPath = quotaPath + '.lock';
  let lock;
  try { lock = openSync(lockPath, 'wx', 0o600); } catch { console.error('Quota lock unavailable. Check for another running server.'); process.exit(1); }
  const release = () => { try { closeSync(lock); unlinkSync(lockPath); } catch {} };
  process.on('exit', release);
  process.on('SIGINT', () => process.exit(0)); process.on('SIGTERM', () => process.exit(0));
  const providers = configuredProviders(process.env);
  const app = createApp({ analyze: createRouter({ providers, quota: new QuotaStore(quotaPath) }), origin: process.env.WEB_ORIGIN ?? '' });
  app.requestTimeout = 15000; app.headersTimeout = 10000;
  app.listen(Number(process.env.PORT ?? 8787), process.env.HOST ?? '127.0.0.1', () => console.log(`Kombiqo analysis service ready; ${providers.length} configured providers. No request bodies are logged.`));
}
