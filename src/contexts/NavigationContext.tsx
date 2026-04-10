import React, { createContext, useContext, useState } from 'react';
import { PageRoute } from '../types';

interface NavigationContextType {
  currentPage: PageRoute;
  navigate: (page: PageRoute) => void;
  history: PageRoute[];
  goBack: () => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<PageRoute>('dashboard');
  const [history, setHistory] = useState<PageRoute[]>([]);

  const navigate = (page: PageRoute) => {
    setHistory(prev => [...prev, currentPage]);
    setCurrentPage(page);
  };

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(h => h.slice(0, -1));
      setCurrentPage(prev);
    }
  };

  return (
    <NavigationContext.Provider value={{ currentPage, navigate, history, goBack }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
