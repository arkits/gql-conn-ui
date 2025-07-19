import React from "react";
import { Box } from "@chakra-ui/react";

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(_error: any, _errorInfo: any) {}
  render() {
    if (this.state.hasError) {
      return (
        <Box p={6} color="red.500" bg="red.50">
          <b>Something went wrong:</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{String(this.state.error)}</pre>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary; 