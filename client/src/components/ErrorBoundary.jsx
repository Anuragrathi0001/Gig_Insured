import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught an error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-[var(--radius)] bg-[var(--card)] border border-[var(--border)] shadow-xl text-center space-y-4 text-[var(--card-foreground)]">
            <div className="w-14 h-14 rounded-full bg-[var(--destructive)]/15 text-[var(--destructive)] border border-[var(--destructive)]/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-[var(--foreground)]">Something went wrong</h3>
              <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                An unexpected interface issue occurred. Your data, policies, and claims remain completely safe.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 rounded-[calc(var(--radius)*0.5)] bg-[var(--muted)]/50 border border-[var(--border)] text-left">
                <p className="text-[11px] font-mono text-[var(--muted-foreground)] break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[calc(var(--radius)*0.5)] bg-[var(--primary)] text-[var(--primary-foreground)] font-bold text-xs hover:brightness-110 transition-all shadow-md active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Dashboard</span>
              </button>
              <a
                href="/"
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-[calc(var(--radius)*0.5)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--secondary-foreground)] border border-[var(--border)] font-semibold text-xs transition-all active:scale-95"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Home</span>
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
