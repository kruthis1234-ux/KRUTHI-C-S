import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  fetchPortfolioSnapshot,
  getAuthStatus,
} from '../lib/repository';
import type { AuthStatus, PortfolioSnapshot } from '../types/portfolio';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface PortfolioContextValue {
  snapshot: PortfolioSnapshot | null;
  authStatus: AuthStatus | null;
  loading: boolean;
  error: string | null;
  refreshPortfolio: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  toasts: ToastItem[];
  notify: (type: ToastItem['type'], message: string) => void;
  dismissToast: (id: string) => void;
}

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [snapshot, setSnapshot] = useState<PortfolioSnapshot | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (type: ToastItem['type'], message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4200);
    },
    [dismissToast]
  );

  const refreshAuth = useCallback(async () => {
    try {
      const status = await getAuthStatus();
      setAuthStatus(status);
    } catch {
      setAuthStatus({
        mode: 'server',
        authenticated: false,
        claimed: true,
        envConfigured: false,
      });
    }
  }, []);

  const refreshPortfolio = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchPortfolioSnapshot();
      setSnapshot(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load portfolio data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshAuth();
      await refreshPortfolio();
    })();
  }, [refreshAuth, refreshPortfolio]);

  return (
    <PortfolioContext.Provider
      value={{
        snapshot,
        authStatus,
        loading,
        error,
        refreshPortfolio,
        refreshAuth,
        toasts,
        notify,
        dismissToast,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error('usePortfolio must be used inside PortfolioProvider');
  return ctx;
}
