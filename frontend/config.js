// API Configuration
const config = {
  // Backend API base URL
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000',
  
  // Development proxy target
  PROXY_TARGET: process.env.REACT_APP_PROXY_TARGET || 'http://127.0.0.1:8000'
};

export default config; 