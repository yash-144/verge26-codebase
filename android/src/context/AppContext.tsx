import React, { createContext, useContext, useState, useEffect } from 'react';

interface AppContextType {
  splashFinished: boolean;
  setSplashFinished: (value: boolean) => void;
  isVerified: boolean;
  setIsVerified: (value: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [splashFinished, setSplashFinished] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  return (
    <AppContext.Provider value={{
      splashFinished,
      setSplashFinished,
      isVerified,
      setIsVerified
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
