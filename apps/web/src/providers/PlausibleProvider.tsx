import React, { createContext, useContext, ReactNode } from 'react';
import { PlausibleInstance, createPlausibleInstance } from '../utils/analytics';

interface PlausibleContextType {
  plausible: PlausibleInstance;
}

const PlausibleContext = createContext<PlausibleContextType | null>(null);

interface PlausibleProviderProps {
  children: ReactNode;
  domain: string;
}

export const PlausibleProvider: React.FC<PlausibleProviderProps> = ({ children, domain }) => {
  const plausible = createPlausibleInstance(domain);

  return <PlausibleContext.Provider value={{ plausible }}>{children}</PlausibleContext.Provider>;
};

export const usePlausible = () => {
  const context = useContext(PlausibleContext);
  if (!context) {
    throw new Error('usePlausible must be used within a PlausibleProvider');
  }
  return context;
};
