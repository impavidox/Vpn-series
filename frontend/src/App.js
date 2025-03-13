import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { UserSelectionProvider } from './context/UserSelectionContext';
import { SearchProvider } from './context/SearchContext';
import Home from './pages/Home';
import Search from './pages/Search';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/index.css';

/**
 * Main App component
 * Sets up routing and context providers
 */
function App() {
  return (
    <ErrorBoundary>
      <UserSelectionProvider>
        <SearchProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </Router>
        </SearchProvider>
      </UserSelectionProvider>
    </ErrorBoundary>
  );
}

export default App;