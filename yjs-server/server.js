const WebSocket = require('ws');
const http = require('http');
const { setupWSConnection } = require('y-websocket/bin/utils');

const PORT = process.env.PORT || 1234;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const YOUR_GO_API_URL = process.env.GO_API_URL || 'http://localhost:8080';

// Create HTTP server
const server = http.createServer((request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain' });
  response.end('Y-WebSocket Server Running\n');
});

// Create WebSocket server
const wss = new WebSocket.Server({ 
  server,
  verifyClient: async (info, callback) => {
    // Extract token from query string
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
      console.log('❌ Connection rejected: No token provided');
      callback(false, 401, 'Unauthorized');
      return;
    }

    // Verify token with your Go API
    try {
      const response = await fetch(`${YOUR_GO_API_URL}/api/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const user = await response.json();
        console.log('✅ Authenticated user:', user.id || user.clerk_user_id);
        
        // Store user info for later use
        info.req.user = user;
        callback(true);
      } else {
        const errorText = await response.text();
        console.log('❌ Token verification failed:', response.status, errorText);
        callback(false, 401, 'Unauthorized - Token expired or invalid');
      }
    } catch (error) {
      console.error('❌ Auth error:', error.message);
      callback(false, 500, 'Internal Server Error');
    }
  }
});

wss.on('connection', (ws, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const docName = url.pathname.slice(1); // Remove leading '/'
  const user = request.user;

  console.log(`\n🔗 New connection to document: ${docName}`);
  console.log(`   User: ${user?.id || user?.clerk_user_id || 'Unknown'}`);
  console.log(`   Total connections: ${wss.clients.size}`);

  // Setup Yjs WebSocket connection
  setupWSConnection(ws, request, {
    docName,
    gc: true // Enable garbage collection
  });

  ws.on('close', () => {
    console.log(`\n❌ Connection closed for document: ${docName}`);
    console.log(`   Remaining connections: ${wss.clients.size}`);
  });
});

// Start server
server.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log('🚀 Y-WebSocket Server Started');
  console.log('='.repeat(50));
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔒 Auth: ${YOUR_GO_API_URL}/api/verify-token`);
  console.log('='.repeat(50) + '\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM received, closing server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
