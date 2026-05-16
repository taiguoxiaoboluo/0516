import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { networkInterfaces } from 'os';

const currentDir = dirname(fileURLToPath(import.meta.url));
const HOST = process.env.HOST || '127.0.0.1';
const START_PORT = Number(process.env.PORT || 3000);
const MAX_PORT_ATTEMPTS = Number(process.env.PORT_ATTEMPTS || 20);

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

function writeJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  });
  res.end(JSON.stringify(data));
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    writeJson(res, 200, { ok: true, service: 'style-sniffer' });
    return;
  }

  // API endpoint
  if (req.method === 'POST' && req.url === '/api/sniff') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { url, darkMode, mobile } = JSON.parse(body);
        const { extract } = await import('../lib/extract/from-url.js');
        const result = await extract(url, { darkMode, mobile });
        writeJson(res, 200, result);
      } catch (error) {
        writeJson(res, 500, { error: error.message });
      }
    });
    return;
  }

  // Static files (including snapshots directory)
  let filePath = req.url === '/' ? '/index.html' : decodeURIComponent(req.url.split('?')[0]);
  const fullPath = join(currentDir, filePath);

  if (!existsSync(fullPath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = extname(fullPath);
  const contentType = MIME_TYPES[ext] || 'text/plain';
  const content = readFileSync(fullPath);
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-cache, no-store, must-revalidate' });
  res.end(content);
});

let attemptsLeft = MAX_PORT_ATTEMPTS;
let activePort = START_PORT;

server.on('listening', () => {
  printReady(activePort);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE' && !process.env.PORT && attemptsLeft > 1) {
    attemptsLeft -= 1;
    activePort += 1;
    console.warn(`端口 ${activePort - 1} 已被占用，尝试 ${activePort}...`);
    server.listen(activePort, HOST);
    return;
  }
  console.error(`[server] ${error.code || 'ERROR'}: ${error.message}`);
  process.exitCode = 1;
});

server.listen(activePort, HOST);

function printReady(port) {
  console.log(`\n🐕‍🦺 Style Sniffer Web UI`);
  console.log(`   本机：http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${port}`);
  // 获取内网 IP 方便分享
  if (HOST === '0.0.0.0') {
    const nets = networkInterfaces();
    Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).forEach(n => {
      console.log(`   内网：http://${n.address}:${port}`);
    });
  }
  console.log('');
}

// 防止未捕获异常导致进程退出
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err.message);
});
process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});
