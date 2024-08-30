import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './Home'; // Import Home component
import Search from './Search'; // Import the existing result page component


function App() {
  return (
    <Router>
      <Routes>
        {/* Home page route */}
        <Route path="/" element={<Home />} />

        {/* Result/Search page route */}
        <Route path="/search" element={<Search />} />
      </Routes>
    </Router>
  );
}

export default App;
