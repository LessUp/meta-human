import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    console.error('ErrorBoundary 捕获错误:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-black flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-6">
            {/* 图标 + 光效 */}
            <div className="relative inline-flex items-center justify-center">
              <div className="absolute w-24 h-24 bg-red-500/10 rounded-full blur-2xl animate-pulse" />
              <div className="relative w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-medium text-slate-800 dark:text-white">
                出现了一些问题
              </h2>
              <p className="text-sm text-slate-500 dark:text-white/40 leading-relaxed max-w-sm mx-auto">
                {this.state.error?.message || '应用程序遇到了意外错误，请尝试刷新页面'}
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-white/80 transition-all active:scale-95"
              >
                <RefreshCw size={14} />
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm text-white transition-all active:scale-95"
              >
                <RefreshCw size={14} />
                刷新页面
              </button>
              <button
                onClick={this.handleHome}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-white/80 transition-all active:scale-95"
              >
                <Home size={14} />
                首页
              </button>
            </div>

            {/* 开发模式详情 */}
            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-slate-400 dark:text-white/30 cursor-pointer hover:text-slate-600 dark:hover:text-white/50 transition-colors text-center">
                  展开错误详情 (开发模式)
                </summary>
                <div className="mt-3 p-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-auto max-h-64">
                  <pre className="text-[11px] text-red-300/80 font-mono whitespace-pre-wrap break-words leading-relaxed">
                    {this.state.error?.stack}
                    {'\n\n── Component Stack ──\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
