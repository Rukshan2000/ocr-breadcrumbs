const https = require('https');
const fs = require('fs');
const path = require('path');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const PORT = 8443;

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = https.createServer(options, (req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './test.html';
  }
  
  const extname = String(path.extname(filePath)).toLowerCase();
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

server.listen(PORT, '0.0.0.0', () => {
  console.log('\n🔒 HTTPS Server running!\n');
  console.log(`   Local:   https://localhost:${PORT}`);
  console.log(`   Network: https://192.168.8.112:${PORT}`);
  console.log('\n📱 To access from mobile:');
  console.log(`   1. Open: https://192.168.8.112:${PORT}`);
  console.log('   2. Accept the security warning (self-signed cert)');
  console.log('   3. Allow camera permissions\n');
});
