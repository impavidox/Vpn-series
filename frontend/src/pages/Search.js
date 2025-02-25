import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Components
import AnimatedBackground from '../components/common/AnimatedBackground';
import SearchHeader from '../components/search/SearchHeader';
import FilterSection from '../components/search/FilterSection';
import ResultsGrid from '../components/search/ResultsGrid';
import SeriesModal from '../components/search/SeriesModal';

// Hooks
import useInfiniteScroll from '../hooks/useInfiniteScroll';

// Services
import ApiService from '../services/api';

// Styles
import '../styles/Search.css';

/**
 * Search page component
 * Handles filtering and displaying search results
 */
const Search = () => {
  // Navigation and location
  const location = useLocation();
  const navigate = useNavigate();
  const { country, streaming } = location.state || {};
  
  // Keep track of initial load to prevent duplicate requests
  const initialLoadCompleted = useRef(false);

  // State
  const [data, setData] = useState([]);
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [appliedTitleFilter, setAppliedTitleFilter] = useState('');
  const [appliedYearFilter, setAppliedYearFilter] = useState('');
  const [animationComplete, setAnimationComplete] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState('1000+');
  const [selectedStreamingProviders] = useState(streaming || []);

  // Data fetching function
  const fetchData = useCallback(async (page = 1, resetData = false) => {
    try {
      const filterCriteria = {
        title: appliedTitleFilter,
        year: appliedYearFilter ? parseInt(appliedYearFilter, 10) : undefined,
        page,
        country,
        streaming: selectedStreamingProviders,
      };

      const responseData = await ApiService.filterShows(filterCriteria);

      // Update data based on page number
      setData(prevData => {
        if (resetData || page === 1) {
          return responseData;
        } else {
          // Make sure we don't add duplicate items when appending data
          const newData = [...prevData];
          const existingIds = new Set(prevData.map(item => item._id));
          
          responseData.forEach(item => {
            if (!existingIds.has(item._id)) {
              newData.push(item);
            }
          });
          
          return newData;
        }
      });
      
      // Determine if there are more results to load
      setHasMore(responseData.length >= 20); // Assuming page size is 20
      
      // For total counts - set to 1000+ if we got a full page, otherwise use actual count
      if (page === 1) {
        if (responseData.length >= 20) {
          setTotalResults('1000+');
        } else {
          setTotalResults(responseData.length);
        }
      }

      return responseData;
    } catch (error) {
      console.error("Error fetching data", error);
      if (page === 1) {
        setData([]);
        setTotalResults(0);
      }
      return [];
    }
  }, [appliedTitleFilter, appliedYearFilter, country, selectedStreamingProviders]);

  // Load more data for infinite scrolling
  const loadMoreData = useCallback((nextPage) => {
    return fetchData(nextPage, false);
  }, [fetchData]);

  // Set up infinite scrolling
  const { loaderRef, isLoading, resetPagination } = useInfiniteScroll(
    loadMoreData,
    hasMore
  );

  // Initial data load
  useEffect(() => {
    // Only fetch initial data once
    if (!initialLoadCompleted.current) {
      fetchData(1, true);
      initialLoadCompleted.current = true;
    }
  }, [fetchData]);

  // Reset initial load flag when filters change
  useEffect(() => {
    initialLoadCompleted.current = false;
  }, [appliedTitleFilter, appliedYearFilter, country, selectedStreamingProviders]);

  // Start animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Handle filter application
  const handleApplyFilters = (title, year) => {
    setAppliedTitleFilter(title);
    setAppliedYearFilter(year);
    resetPagination();
    setData([]);
    setHasMore(true);
    // Initial load flag reset is handled in the dependency effect
  };

  // Handle item selection
  const handleItemClick = (item) => {
    setSelectedSeries(item);
  };

  // Close modal
  const closeModal = () => {
    setSelectedSeries(null);
  };

  // Navigate back to home
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="search-page-container">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Header section */}
      <SearchHeader 
        animationComplete={animationComplete}
        country={country}
        selectedStreamingProviders={selectedStreamingProviders}
        onLogoClick={handleBackToHome}
      />

      {/* Filter section */}
      <FilterSection 
        animationComplete={animationComplete}
        onApplyFilters={handleApplyFilters}
      />

      {/* Results grid */}
      <ResultsGrid 
        data={data}
        isLoading={isLoading}
        hasMore={hasMore}
        totalResults={totalResults}
        appliedTitleFilter={appliedTitleFilter}
        appliedYearFilter={appliedYearFilter}
        animationComplete={animationComplete}
        onItemClick={handleItemClick}
        loaderRef={loaderRef}
      />

      {/* Series detail modal */}
      <SeriesModal 
        series={selectedSeries}
        streamingProviders={selectedStreamingProviders}
        onClose={closeModal}
      />
    </div>
  );
};

export default Search;