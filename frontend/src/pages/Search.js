import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Components
import AnimatedBackground from '../components/common/AnimatedBackground';
import SearchHeader from '../components/search/SearchHeader';
import ResultsGrid from '../components/search/ResultsGrid';
import SeriesModal from '../components/search/SeriesModal';

// Hooks
import useInfiniteScroll from '../hooks/useInfiniteScroll';

// Services
import ApiService from '../services/api';

import '../styles/index.css';
import '../styles/Search.css';
import '../styles/HeaderSearchFilter.css';

// Define our z-index values
document.documentElement.style.setProperty('--z-index-modal', '2000');

/**
 * Search page component with integrated header search, filter popup, and progressive loading
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
  const [detailedData, setDetailedData] = useState({});
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [appliedTitleFilter, setAppliedTitleFilter] = useState('');
  const [appliedYearFilter, setAppliedYearFilter] = useState('');
  const [appliedGenreFilter, setAppliedGenreFilter] = useState([]);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState('1000+');
  const [selectedStreamingProviders] = useState(streaming || []);

  // Data fetching function for grid items (minimal data)
  const fetchData = useCallback(async (page = 1, resetData = false) => {
    try {
      const filterCriteria = {
        title: appliedTitleFilter,
        year: appliedYearFilter ? parseInt(appliedYearFilter, 10) : undefined,
        page,
        country,
        streaming: selectedStreamingProviders,
        genres: appliedGenreFilter.length > 0 ? appliedGenreFilter : undefined,
        projection: "minimal" // Request minimal data fields for grid display
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
  }, [appliedTitleFilter, appliedYearFilter, appliedGenreFilter, country, selectedStreamingProviders]);

  // Function to fetch detailed data in the background
  const fetchDetailedData = useCallback(async (items) => {
    if (!items || items.length === 0) return;
    
    // Get IDs for items that we don't already have detailed data for
    const missingDetailIds = items
      .filter(item => !detailedData[item._id])
      .map(item => item._id);
    
    if (missingDetailIds.length === 0) return;
    
    try {
      // Batch fetch detailed data for multiple items
      const detailedCriteria = {
        ids: missingDetailIds,
        country,
        streaming: selectedStreamingProviders,
        projection: "full" // Request all fields
      };
      
      const detailedResults = await ApiService.batchGetShowDetails(detailedCriteria);
      
      // Merge new detailed data with existing data
      setDetailedData(prevData => {
        const newData = { ...prevData };
        detailedResults.forEach(item => {
          if (item && item._id) {
            newData[item._id] = item;
          }
        });
        return newData;
      });
    } catch (error) {
      console.error("Error fetching detailed data:", error);
    }
  }, [country, selectedStreamingProviders, detailedData]);

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
  }, [appliedTitleFilter, appliedYearFilter, appliedGenreFilter, country, selectedStreamingProviders]);

  // Start animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Background fetch of detailed data after initial data loads
  useEffect(() => {
    if (data.length > 0) {
      // Fetch first batch of detailed data immediately
      fetchDetailedData(data.slice(0, 10));
      
      // Fetch the rest with a slight delay to prioritize initial render
      const timer = setTimeout(() => {
        fetchDetailedData(data.slice(10));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [data, fetchDetailedData]);

  // Handle header search
  const handleHeaderSearch = (searchTerm) => {
    setAppliedTitleFilter(searchTerm);
    resetPagination();
    setData([]);
    setHasMore(true);
    // Initial load flag reset is handled in the dependency effect
  };

  // Handle filter application
  const handleApplyFilters = (title, year, genres) => {
    setAppliedTitleFilter(title);
    setAppliedYearFilter(year);
    setAppliedGenreFilter(genres);
    resetPagination();
    setData([]);
    setHasMore(true);
    // Initial load flag reset is handled in the dependency effect
  };

  // Handle item selection
  const handleItemClick = async (item) => {
    // Check if we already have detailed data for this item
    if (detailedData[item._id]) {
      // Use the detailed data we already have
      setSelectedSeries(detailedData[item._id]);
    } else {
      // Set the basic item data first so modal can show immediately
      setSelectedSeries(item);
      setIsLoadingDetails(true);
      
      try {
        // Fetch detailed data for this specific item
        const detailedItem = await ApiService.getShowDetails(item._id, {
          country,
          streaming: selectedStreamingProviders
        });
        
        // Update the selected series with detailed data
        setSelectedSeries(detailedItem);
        
        // Also store in our cache
        setDetailedData(prev => ({
          ...prev,
          [item._id]: detailedItem
        }));
      } catch (error) {
        console.error("Error fetching show details:", error);
      } finally {
        setIsLoadingDetails(false);
      }
    }
  };

  // Close modal
  const closeModal = () => {
    setSelectedSeries(null);
    setIsLoadingDetails(false);
  };

  // Navigate back to home
  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="search-page-container">
      {/* Animated background */}
      <AnimatedBackground />

      {/* Header section with integrated search */}
      <SearchHeader 
        animationComplete={animationComplete}
        country={country}
        selectedStreamingProviders={selectedStreamingProviders}
        onLogoClick={handleBackToHome}
        titleFilter={appliedTitleFilter}
        onSearch={handleHeaderSearch}
      />

      {/* Results grid with filter popup trigger */}
      <ResultsGrid 
        data={data}
        isLoading={isLoading}
        hasMore={hasMore}
        totalResults={totalResults}
        appliedTitleFilter={appliedTitleFilter}
        appliedYearFilter={appliedYearFilter}
        appliedGenreFilter={appliedGenreFilter}
        animationComplete={animationComplete}
        onItemClick={handleItemClick}
        onApplyFilters={handleApplyFilters}
        loaderRef={loaderRef}
      />

      {/* Series detail modal */}
      <SeriesModal 
        series={selectedSeries}
        streamingProviders={selectedStreamingProviders}
        isLoadingDetails={isLoadingDetails}
        onClose={closeModal}
      />
    </div>
  );
};

export default Search;