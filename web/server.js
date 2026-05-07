import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const currentDir = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

const server = createServer(async (req, res) => {
  // API endpoint
  if (req.method === 'POST' && req.url === '/api/sniff') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const { url, darkMode, mobile } = JSON.parse(body);
        const { extract } = await import('../lib/extract/from-url.js');
        const result = await extract(url, { darkMode, mobile });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
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

server.listen(PORT, () => {
  console.log(`\n🐕‍🦺 Style Sniffer Web UI`);
  console.log(`   http://localhost:${PORT}\n`);
});
