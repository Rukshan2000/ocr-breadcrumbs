const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = 3443;

// SSL certificates
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = https.createServer(options, (req, res) => {
  console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${req.url}`);
  
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  const extname = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404);
        res.end('File not found');
      } else {
        res.writeHead(500);
        res.end('Server error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Get local IP address
const { networkInterfaces } = require('os');
const nets = networkInterfaces();
let localIP = 'localhost';
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      localIP = net.address;
      break;
    }
  }
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('┌─────────────────────────────────────────────────────┐');
  console.log('│                                                     │');
  console.log('│   🔒 HTTPS Server Running!                          │');
  console.log('│                                                     │');
  console.log(`│   Local:   https://localhost:${PORT}                  │`);
  console.log(`│   Network: https://${localIP}:${PORT}              │`);
  console.log('│                                                     │');
  console.log('│   ⚠️  Accept the security warning in your browser   │');
  console.log('│      (it\'s a self-signed certificate)              │');
  console.log('│                                                     │');
  console.log('│   📱 On mobile: Open the Network URL and tap        │');
  console.log('│      "Advanced" → "Proceed" to accept               │');
  console.log('│                                                     │');
  console.log('└─────────────────────────────────────────────────────┘');
  console.log('');
});
