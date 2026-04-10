import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface RouteErrorBoundaryProps {
  children: ReactNode;
  resetKey?: string;
}

interface RouteErrorBoundaryState {
  error: Error | null;
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Route render failed.', error, info);
  }

  componentDidUpdate(prevProps: RouteErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full min-h-[50vh] items-center justify-center bg-osint-dark px-6">
          <div className="max-w-md rounded-xl border border-zinc-800 bg-black/70 p-6 text-center text-zinc-200">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-zinc-500">
              View Recovery
            </div>
            <h2 className="mt-3 text-xl font-semibold text-zinc-100">This page failed to render</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Sherlock caught a route error before it blanked the app. You can retry the view or
              reload cleanly if the state is still invalid.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                className="osint-button-primary rounded-lg px-4 py-2 text-sm"
                onClick={() => this.setState({ error: null })}
                type="button"
              >
                Retry View
              </button>
              <button
                className="osint-button-chrome rounded-lg px-4 py-2 text-sm"
                onClick={() => window.location.reload()}
                type="button"
              >
                Reload App
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
