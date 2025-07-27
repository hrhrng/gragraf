const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Get proxy target from environment variable or use default
  const proxyTarget = process.env.REACT_APP_PROXY_TARGET || 'http://127.0.0.1:8000';
  console.log('Proxy target:', proxyTarget);
  
  // Proxy all API requests to backend
  app.use(
    ['/api', '/workflows', '/run', '/debug'],
    createProxyMiddleware({
      target: proxyTarget,
      changeOrigin: true,
      logLevel: 'debug',
      pathRewrite: {
        '^/api': '', // Remove /api prefix when forwarding to backend
      }
    })
  );
}; 