import React, { createContext, useContext, useState } from 'react';

// Create the context
const AppContext = createContext();

/**
 * App context provider to manage global state
 */
export const AppProvider = ({ children }) => {
  // Global state for selections that need to be shared between pages
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedStreaming, setSelectedStreaming] = useState([]);
  const [selectedContinent, setSelectedContinent] = useState(null);

  // Provide the context values
  const value = {
    selectedCountry,
    setSelectedCountry,
    selectedStreaming,
    setSelectedStreaming,
    selectedContinent,
    setSelectedContinent,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

/**
 * Custom hook to use the app context
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;