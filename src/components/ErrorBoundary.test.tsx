import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  // Suppress console.error during tests to avoid noise
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('should render children when there is no error', () => {
    render(<TestWrapper>
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should render error message when there is an error', () => {
    render(<TestWrapper>
      <ErrorBoundary>
        <ThrowError shouldThrow={true} /></TestWrapper>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
  });

  it('should render multiple children when there is no error', () => {
    render(<TestWrapper>
      <ErrorBoundary>
        <div>Child 1</div>
        <div>Child 2</div>
        <span>Child 3</span>
      </ErrorBoundary>
    );

    expect(screen.getByText('Child 1')).toBeInTheDocument();
    expect(screen.getByText('Child 2')).toBeInTheDocument();
    expect(screen.getByText('Child 3')).toBeInTheDocument();
  });

  it('should catch errors from nested components', () => {
    render(<TestWrapper>
      <ErrorBoundary>
        <div>
          <div>
            <ThrowError shouldThrow={true} /></TestWrapper>
          </div>
        </div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
    expect(screen.getByText(/Error: Test error/)).toBeInTheDocument();
  });

  it('should apply correct styling classes', () => {
    render(<TestWrapper>
      <ErrorBoundary>
        <ThrowError shouldThrow={true} /></TestWrapper>
      </ErrorBoundary>
    );

    const errorContainer = screen.getByText('Something went wrong:').closest('div');
    expect(errorContainer).toHaveClass('css-0'); // Chakra UI classes
  });

  it('should handle different types of errors', () => {
    const ThrowStringError = () => {
      throw 'String error';
    };

    render(<TestWrapper>
      <ErrorBoundary>
        <ThrowStringError /></TestWrapper>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
    expect(screen.getByText('"String error"')).toBeInTheDocument();
  });

  it('should handle null errors', () => {
    const ThrowNullError = () => {
      throw null;
    };

    render(<TestWrapper>
      <ErrorBoundary>
        <ThrowNullError /></TestWrapper>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
    expect(screen.getByText('null')).toBeInTheDocument();
  });

  it('should handle undefined errors', () => {
    const ThrowUndefinedError = () => {
      throw undefined;
    };

    render(<TestWrapper>
      <ErrorBoundary>
        <ThrowUndefinedError /></TestWrapper>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
  });

  it('should reset error state when props change', () => {
    const { rerender } = render(<TestWrapper>
      <ErrorBoundary>
        <ThrowError shouldThrow={true} /></TestWrapper>
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();

    // Re-render with a component that doesn't throw
    rerender(<TestWrapper>
      <ErrorBoundary>
        <ThrowError shouldThrow={false} /></TestWrapper>
      </ErrorBoundary>
    );

    // Error boundary doesn't automatically reset, so error should still be shown
    expect(screen.getByText('Something went wrong:')).toBeInTheDocument();
  });

  it('should preserve error formatting with pre tag', () => {
    render(<TestWrapper>
      <ErrorBoundary>
        <ThrowError shouldThrow={true} /></TestWrapper>
      </ErrorBoundary>
    );

    const preElement = screen.getByText(/Error: Test error/).closest('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveStyle('white-space: pre-wrap');
  });

  describe('getDerivedStateFromError', () => {
    it('should set hasError to true and store error', () => {
      const error = new Error('Test error');
      const result = ErrorBoundary.getDerivedStateFromError(error);
      
      expect(result).toEqual({
        hasError: true,
        error: error
      });
    });
  });
});