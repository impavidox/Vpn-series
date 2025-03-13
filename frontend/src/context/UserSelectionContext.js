import React, { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

// Create the context
const UserSelectionContext = createContext();

/**
 * Provider for user selection state (country, continent, streaming services)
 */
export const UserSelectionProvider = ({ children }) => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedContinent, setSelectedContinent] = useState(null);
  const [selectedStreaming, setSelectedStreaming] = useState([]);

  // Handle streaming service selection toggle
  const handleStreamingSelection = (streaming) => {
    setSelectedStreaming((prevSelected) =>
      prevSelected.includes(streaming)
        ? prevSelected.filter((s) => s !== streaming)
        : [...prevSelected, streaming]
    );
  };

  // Reset all selections
  const resetSelections = () => {
    setSelectedCountry(null);
    setSelectedContinent(null);
    setSelectedStreaming([]);
  };

  return (
    <UserSelectionContext.Provider
      value={{
        selectedCountry,
        setSelectedCountry,
        selectedContinent,
        setSelectedContinent,
        selectedStreaming,
        setSelectedStreaming,
        handleStreamingSelection,
        resetSelections,
      }}
    >
      {children}
    </UserSelectionContext.Provider>
  );
};

UserSelectionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to use the user selection context
 */
export const useUserSelection = () => {
  const context = useContext(UserSelectionContext);
  if (context === undefined) {
    throw new Error('useUserSelection must be used within a UserSelectionProvider');
  }
  return context;
};

export default UserSelectionContext;