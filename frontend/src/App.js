import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import Search from './pages/Search';
import './styles/index.css';

/**
 * Main App component
 * Sets up routing and context providers
 */
function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Home page route */}
          <Route path="/" element={<Home />} />

          {/* Search page route */}
          <Route path="/search" element={<Search />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}

export default App;