
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null
        };
    }

    public readonly state: State = {
        hasError: false,
        error: null
    };


    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    // If you need to log errors, do it here
    // public logErrorToMyService(error: Error, errorInfo: React.ErrorInfo) {
    //     console.error("Uncaught error:", error, errorInfo);
    // }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-[#0f1115] p-4 text-white">
                    <div className="bg-[#161b22] p-6 rounded-xl shadow-xl max-w-md w-full border border-red-900/30">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <span className="material-symbols-outlined text-3xl">error</span>
                            <h2 className="text-xl font-bold">Something went wrong</h2>
                        </div>
                        <p className="text-slate-300 mb-4">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
                        >
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
