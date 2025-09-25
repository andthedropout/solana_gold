import React from 'react';

interface SectionWrapperProps {
  loading: boolean;
  error: string | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
}

class SectionErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Silently catch section rendering errors to prevent CMS disruption
    console.warn('Section rendering error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Return minimal fallback UI that won't disrupt CMS
      return (
        <section className="w-full py-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <div className="text-muted-foreground text-sm">Section temporarily unavailable</div>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
}

export const SectionWrapper: React.FC<SectionWrapperProps> = ({ 
  loading, 
  error, 
  loadingComponent,
  errorComponent,
  children 
}) => {
  if (loading) {
    return loadingComponent || (
      <section className="w-full py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="animate-pulse">
            <div className="h-16 bg-muted rounded mb-6 max-w-4xl mx-auto"></div>
            <div className="h-6 bg-muted rounded mb-8 max-w-3xl mx-auto"></div>
            <div className="flex gap-4 justify-center">
              <div className="h-12 w-32 bg-muted rounded"></div>
              <div className="h-12 w-32 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return errorComponent || (
      <section className="w-full py-24 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-red-500">Error loading section: {error}</div>
        </div>
      </section>
    );
  }

  return (
    <SectionErrorBoundary>
      {children}
    </SectionErrorBoundary>
  );
}; 