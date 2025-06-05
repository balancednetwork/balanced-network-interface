import * as Sentry from '@sentry/react';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    // Disable automatic performance monitoring
    tracesSampleRate: 0,
    // Disable session replay
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    // Disable automatic error capturing
    enabled: true,
    // Only capture errors that we explicitly send
    attachStacktrace: true,
    // Set environment
    environment: process.env.NODE_ENV,
  });
};

// Export Sentry for direct usage
export { Sentry };

// Helper functions for common logging scenarios
export const logError = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

export const logMessage = (message: string, context?: Record<string, any>, level: Sentry.SeverityLevel = 'info') => {
  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
};

// Export Sentry's error boundary component
export const SentryErrorBoundary = Sentry.ErrorBoundary;
