'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface SubtitleContextType {
  subtitle: string | undefined;
  setSubtitle: (subtitle: string | undefined) => void;
}

const SubtitleContext = createContext<SubtitleContextType | undefined>(undefined);

export const SubtitleProvider = ({ children }: { children: ReactNode }) => {
  const [subtitle, setSubtitle] = useState<string | undefined>();

  return (
    <SubtitleContext.Provider value={{ subtitle, setSubtitle }}>
      {children}
    </SubtitleContext.Provider>
  );
};

export const useSubtitle = () => {
  const context = useContext(SubtitleContext);
  if (!context) {
    throw new Error('useSubtitle must be used within SubtitleProvider');
  }
  return context;
};