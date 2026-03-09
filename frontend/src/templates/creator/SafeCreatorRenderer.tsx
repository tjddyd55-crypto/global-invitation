'use client';

import { Component, type ComponentType, type ReactNode } from 'react';

type SafeCreatorRendererProps = {
  creatorRenderer: ComponentType<any>;
  fallbackRenderer: ComponentType<any>;
  creatorProps: Record<string, unknown>;
  fallbackProps: Record<string, unknown>;
};

type SafeCreatorRendererState = {
  hasError: boolean;
};

class CreatorRenderErrorBoundary extends Component<
  { fallback: ReactNode; resetKey: string; children: ReactNode },
  SafeCreatorRendererState
> {
  state: SafeCreatorRendererState = { hasError: false };

  static getDerivedStateFromError(): SafeCreatorRendererState {
    return { hasError: true };
  }

  componentDidUpdate(prevProps: { resetKey: string }) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: unknown) {
    console.error('Creator renderer failed, falling back to default renderer.', error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function SafeCreatorRenderer({
  creatorRenderer: CreatorRenderer,
  fallbackRenderer: FallbackRenderer,
  creatorProps,
  fallbackProps,
}: SafeCreatorRendererProps) {
  const resetKey = String(fallbackProps.data ? JSON.stringify(Object.keys(fallbackProps.data as object)) : 'default');
  return (
    <CreatorRenderErrorBoundary
      resetKey={resetKey}
      fallback={<FallbackRenderer {...fallbackProps} />}
    >
      <CreatorRenderer {...creatorProps} />
    </CreatorRenderErrorBoundary>
  );
}
