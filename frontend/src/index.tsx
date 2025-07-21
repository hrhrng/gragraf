import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';

// 全局错误处理 - 捕获并忽略 ResizeObserver 错误
// 这是一个已知的 Radix UI Popover 组件问题，不影响功能
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.length > 0 && typeof args[0] === 'string' && (
    args[0].includes('ResizeObserver loop completed') ||
    args[0].includes('ResizeObserver loop limit') ||
    args[0].includes('ResizeObserver')
  )) {
    return; // 忽略 ResizeObserver 错误
  }
  originalConsoleError.apply(console, args);
};

// 捕获全局错误事件
const handleGlobalError = (event: ErrorEvent) => {
  if (event.message && (
    event.message.includes('ResizeObserver loop completed') ||
    event.message.includes('ResizeObserver loop limit') ||
    event.message.includes('ResizeObserver')
  )) {
    event.preventDefault();
    return;
  }
  console.error('Unhandled error:', event);
};

window.addEventListener('error', handleGlobalError);

// 处理未捕获的 Promise 拒绝
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason?.message?.includes('ResizeObserver')) {
    event.preventDefault();
    return;
  }
  console.error('Unhandled promise rejection:', event.reason);
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Theme 
      appearance="dark" 
      accentColor="blue" 
      grayColor="slate" 
      radius="medium"
      scaling="100%"
    >
      <App />
    </Theme>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
