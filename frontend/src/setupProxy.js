const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get proxy target from environment variable or use default
  const proxyTarget = process.env.REACT_APP_PROXY_TARGET || 'http://127.0.0.1:8000';
  console.log('Proxy target:', proxyTarget);
  
  app.use(
    '/api',
    createProxyMiddleware({
      target: proxyTarget,
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to backend
      },
      logLevel: 'debug',
    })
  );
  
  // Also proxy root paths for backward compatibility
  app.use(
    ['/run', '/workflows', '/debug'],
    createProxyMiddleware({
      target: proxyTarget,
      changeOrigin: true,
      logLevel: 'debug',
    })
  );
}; 