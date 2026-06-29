'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';

export type ViewProWidgetAgent = {
  username: string;
  name: string;
  avatar: string;
  status: string;
};

type ViewProWidget = {
  isAvailable?: () => boolean;
  agents?: () => ViewProWidgetAgent[];
  open?: () => void;
};

declare global {
  interface Window {
    ViewProWidget?: ViewProWidget;
  }
}

function getViewProWidget(): ViewProWidget | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.ViewProWidget;
}

function openViewProWidget(): void {
  getViewProWidget()?.open?.();
}

function mapApiAgent(agent: Record<string, unknown>): ViewProWidgetAgent {
  return {
    username: String(agent.username ?? ''),
    name: String(agent.name ?? agent.username ?? ''),
    avatar: String(agent.avatar ?? 'default.jpg'),
    status: String(agent.status ?? 'dead'),
  };
}

async function fetchLiveAgentsFromApi(): Promise<ViewProWidgetAgent[]> {
  const res = (await api.get('agent', {
    params: { type: 'check' },
    silent: true,
  })) as { data?: { agents?: Record<string, unknown>[] } };

  return (res.data?.agents ?? []).map(mapApiAgent);
}

const POLL_MS = 500;
const API_REFRESH_MS = 30000;

export type ViewProWidgetContextValue = {
  isAvailable: boolean;
  agents: ViewProWidgetAgent[];
  open: () => void;
};

const ViewProWidgetContext = createContext<ViewProWidgetContextValue | null>(null);

export function ViewProWidgetProvider({ children }: { children: ReactNode }) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [agents, setAgents] = useState<ViewProWidgetAgent[]>([]);
  // Live agent availability is a client-only signal. The home page is statically
  // prerendered with isAvailable=false, so we must keep the FIRST client render
  // identical (offline) and only reveal live UI after mount — otherwise the
  // header/CTA buttons differ between server HTML and client and React throws a
  // hydration mismatch.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ignore = false;

    const syncFromWidget = () => {
      const w = getViewProWidget();
      const widgetAgents = w?.agents?.() ?? [];
      if (widgetAgents.length > 0 || w?.isAvailable?.()) {
        setIsAvailable(!!w?.isAvailable?.());
        setAgents(widgetAgents);
        return true;
      }
      return false;
    };

    const refreshFromApi = async () => {
      try {
        const liveAgents = await fetchLiveAgentsFromApi();
        if (ignore) return;
        setAgents(liveAgents);
        setIsAvailable(liveAgents.length > 0);
      } catch {
        if (ignore) return;
        if (!syncFromWidget()) {
          setIsAvailable(false);
        }
      }
    };

    syncFromWidget();
    refreshFromApi();

    const widgetInterval = window.setInterval(syncFromWidget, POLL_MS);
    const apiInterval = window.setInterval(refreshFromApi, API_REFRESH_MS);
    window.addEventListener('focus', refreshFromApi);

    return () => {
      ignore = true;
      window.clearInterval(widgetInterval);
      window.clearInterval(apiInterval);
      window.removeEventListener('focus', refreshFromApi);
    };
  }, []);

  const open = useCallback(() => {
    openViewProWidget();
  }, []);

  const value = useMemo(
    () => ({
      isAvailable: mounted && isAvailable,
      agents: mounted ? agents : [],
      open,
    }),
    [mounted, isAvailable, agents, open],
  );

  return <ViewProWidgetContext.Provider value={value}>{children}</ViewProWidgetContext.Provider>;
}

export function useViewProWidget(): ViewProWidgetContextValue {
  const ctx = useContext(ViewProWidgetContext);
  if (!ctx) {
    throw new Error('useViewProWidget must be used within ViewProWidgetProvider');
  }
  return ctx;
}
