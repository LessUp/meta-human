import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// 懒加载页面组件
const LandingPage = lazy(() => import('@/pages/LandingPage'));
const DigitalHumanPage = lazy(() => import('@/pages/DigitalHumanPage'));
const AdvancedDigitalHumanPage = lazy(() => import('@/pages/AdvancedDigitalHumanPage'));

// 页面加载 fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <LoadingSpinner size="lg" text="加载中..." />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Landing Page - 产品落地页 */}
            <Route path="/" element={<LandingPage />} />
            
            {/* App Routes - 数字人应用 */}
            <Route path="/app" element={<AdvancedDigitalHumanPage />} />
            <Route path="/advanced" element={<AdvancedDigitalHumanPage />} />
            <Route path="/digital-human" element={<DigitalHumanPage />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
