"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20">
            <h3 className="font-semibold text-red-800 dark:text-red-200">Something went wrong</h3>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">
              {this.state.error?.message || "An unexpected error occurred."}
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
