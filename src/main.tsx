import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { loggers } from './lib/logger';

const logger = loggers.app;

if (import.meta.env.DEV) {
  logger.info('MetaHuman Engine DEV mode');
}

// 处理从 404.html 重定向回来的情况
(function handleRedirect() {
  try {
    const redirectData = sessionStorage.getItem('spa_redirect');
    if (redirectData) {
      const { path } = JSON.parse(redirectData);
      sessionStorage.removeItem('spa_redirect');

      // HashRouter 使用 hash 来管理路由
      // 构建目标 hash 路径
      const targetHash = path || '/';
      const allowedRoutes = new Set(['/', '/app', '/advanced', '/digital-human']);

      // 设置 hash 路由
      if (targetHash !== '/' && allowedRoutes.has(targetHash)) {
        window.location.hash = targetHash;
      }

      logger.info('Restored route from redirect:', targetHash);
    }
  } catch (_e) {
    // 忽略解析错误
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster position="top-center" theme="dark" richColors closeButton />
  </StrictMode>,
);
