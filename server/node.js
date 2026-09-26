import { createServer } from 'node:http';
import api from './api.js';

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 8787);
const env = {
  WOWAUDIT_API_KEY: process.env.WOWAUDIT_API_KEY,
  DISCORD_APPLICATION_WEBHOOK: process.env.DISCORD_APPLICATION_WEBHOOK,
};

createServer(async (incoming, outgoing) => {
  try {
    const url = new URL(incoming.url || '/', `http://${incoming.headers.host || `${host}:${port}`}`);
    if (url.pathname === '/health') {
      outgoing.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      outgoing.end('{"ok":true}');
      return;
    }
    if (!url.pathname.startsWith('/api/')) {
      outgoing.writeHead(404);
      outgoing.end();
      return;
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) {
      if (value) headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }
    const forwarded = incoming.headers['x-forwarded-for'];
    const clientIp = process.env.TRUST_PROXY === 'true' && typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim() : incoming.socket.remoteAddress;
    if (clientIp) headers.set('X-Client-IP', clientIp);

    let body;
    if (incoming.method === 'POST') {
      const chunks = [];
      let size = 0;
      for await (const chunk of incoming) {
        size += chunk.length;
        if (size > 8000) {
          outgoing.writeHead(413, { 'Content-Type': 'application/json; charset=utf-8' });
          outgoing.end('{"error":"Zgłoszenie jest zbyt długie."}');
          return;
        }
        chunks.push(chunk);
      }
      body = Buffer.concat(chunks);
    }

    const request = new Request(url, { method: incoming.method, headers, body });
    const response = await api.fetch(request, env);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error(`API error: ${String(error)}`);
    if (!outgoing.headersSent) outgoing.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    outgoing.end('{"error":"Serwer jest chwilowo niedostępny."}');
  }
}).listen(port, host, () => console.log(`Guild API listening on http://${host}:${port}`));
