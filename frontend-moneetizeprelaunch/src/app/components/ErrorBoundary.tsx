import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 w-full h-full bg-[#0a0e1a] flex items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-white text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-6">Please refresh the page to try again.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}