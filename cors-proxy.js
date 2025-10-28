#!/usr/bin/env node

/**
 * Simple CORS Proxy Server for Cosmic Birthday Finder
 * 
 * This proxy server enables the React app to bypass CORS restrictions
 * when calling external APIs like USNO Navy and OPALE IMCCE.
 * check inh
 * Usage: node cors-proxy.js
 * Server will start on http://localhost:8080
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8080;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '3600'
};

const server = http.createServer((req, res) => {
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  // Extract target URL from the request path
  const targetUrl = req.url.substring(1); // Remove leading slash
  
  if (!targetUrl || !targetUrl.startsWith('http')) {
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Invalid URL. Usage: http://localhost:8080/https://api.example.com/endpoint' 
    }));
    return;
  }

  console.log(`[${new Date().toISOString()}] Proxying: ${targetUrl}`);

  try {
    const parsedUrl = new URL(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        host: parsedUrl.hostname
      }
    };

    // Remove headers that might cause issues
    delete options.headers.origin;
    delete options.headers.referer;

    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    const proxyReq = protocol.request(options, (proxyRes) => {
      // Set CORS headers and forward response headers
      const responseHeaders = {
        ...corsHeaders,
        ...proxyRes.headers
      };

      res.writeHead(proxyRes.statusCode, responseHeaders);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.writeHead(500, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Proxy request failed', details: err.message }));
    });

    // Forward request body if present
    req.pipe(proxyReq, { end: true });

  } catch (err) {
    console.error('URL parsing error:', err);
    res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Invalid URL format', details: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Usage: http://localhost:${PORT}/https://api.example.com/endpoint`);
  console.log(`🌟 Ready for Cosmic Birthday Finder API calls!`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please close other applications using this port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down CORS proxy server...');
  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});
