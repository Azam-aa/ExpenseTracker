import { Component, type ErrorInfo, type ReactNode } from 'react';
import { appFolder } from '../services/storage/appFolder';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
    appFolder.logError('ErrorBoundary caught exception', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: 'var(--color-bg)',
            color: 'var(--color-text)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
            Something went wrong
          </div>
          <div style={{ fontSize: '14px', color: 'var(--color-text-dim)', marginBottom: '24px' }}>
            Your data is completely safe. Tap reload to restart the app.
          </div>
          <button
            onClick={this.handleReload}
            style={{
              padding: '12px 28px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 600
            }}
          >
            Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
