import React, { ErrorInfo } from 'react';
import { useToast } from "../use-toast";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps & 
{ onError?: (error: Error) => void }, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children; 
  }
}

export const ErrorBoundaryWithToast: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const { toast } = useToast();

  return (
    <ErrorBoundary
      onError={(error: Error) => {
        toast({
          title: "An error occurred",
          description: error.message,
          variant: "destructive",
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};