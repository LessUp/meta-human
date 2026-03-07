import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useTheme } from "@/hooks/useTheme";

// 懒加载页面组件
const DigitalHumanPage = lazy(() => import("@/pages/DigitalHumanPage"));
const AdvancedDigitalHumanPage = lazy(() => import("@/pages/AdvancedDigitalHumanPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));

// 页面加载 fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-black flex flex-col items-center justify-center gap-6">
      <div className="text-2xl font-light tracking-[0.3em] uppercase text-blue-600/60 dark:text-blue-100/60 animate-pulse">
        MetaHuman
      </div>
      <LoadingSpinner size="lg" text="正在加载系统模块..." />
    </div>
  );
}

export default function App() {
  useTheme();

  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<AdvancedDigitalHumanPage />} />
            <Route path="/digital-human" element={<DigitalHumanPage />} />
            <Route path="/advanced" element={<AdvancedDigitalHumanPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
