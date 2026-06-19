import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Replace with Sentry or your logging service in production
    if (process.env.NODE_ENV === "production") {
      // Sentry.captureException(error, { extra: errorInfo });
      console.error("Production error logged:", error);
    } else {
      console.error("Application Error:", error);
      console.error("Error Info:", errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided via props
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
        >
          <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-4">
            An unexpected error occurred while rendering the application.
          </p>

          <div className="flex gap-3 mb-6">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded border"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded border"
            >
              Reload Application
            </button>
          </div>

          {/* Show error details in development only */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="text-left text-sm mt-4 max-w-xl w-full">
              <summary className="cursor-pointer font-medium mb-2">
                Error Details (dev only)
              </summary>
              <pre className="bg-gray-100 p-3 rounded overflow-auto text-red-600">
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
