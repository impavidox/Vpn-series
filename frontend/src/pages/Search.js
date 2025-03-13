import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../context/SearchContext';
import { useUserSelection } from '../context/UserSelectionContext';
import useInfiniteScroll from '../hooks/useInfiniteScroll';
import ApiService from '../services/api';

// Components
import SearchHeader from '../components/search/SearchHeader';
import ResultsGrid from '../components/search/ResultsGrid';
import SeriesModal from '../components/search/SeriesModal';
import AnimatedBackground from '../components/common/AnimatedBackground';
import SkipLink from '../components/common/SkipLink';
import ErrorBoundary from '../components/common/ErrorBoundary';

// Styles
import '../styles/pages/Search.css';

/**
 * Search page component
 */
const Search = () => {
  const navigate = useNavigate();
  
  // Get state and actions from contexts
  const { 
    state: { 
      results, 
      isLoading, 
      error, 
      filters, 
      pagination, 
      selectedItem, 
      isLoadingDetails 
    },
    setSearchResults,
    setLoading,
    setError,
    setFilters,
    setPage,
    setSelectedItem,
    resetState,
  } = useSearch();
  
  const { selectedCountry, selectedStreaming } = useUserSelection();
  
  // If no country or streaming services are selected, redirect to home
  useEffect(() => {
    if (!selectedCountry) {
      navigate('/');
    }
  }, [selectedCountry, navigate]);
  
  // Fetch data
  const fetchData = useCallback(async (page = 1, resetData = false) => {
    try {
      setLoading(true);
      
      const filterCriteria = {
        title: filters.title,
        year: filters.year ? parseInt(filters.year, 10) : undefined,
        page,
        country: selectedCountry?.id,
        streaming: selectedStreaming,
        genres: filters.genres.length > 0 ? filters.genres : undefined,
        projection: "minimal"
      };
      
      const data = await ApiService.filterShows(filterCriteria);
      
      // Determine if there are more results
      const hasMore = data.length >= 20; // Assuming page size is 20
      
      // Set totalResults based on first page results
      const totalResults = page === 1 && data.length >= 20 ? '1000+' : data.length;
      
      setSearchResults(data, resetData, totalResults, hasMore);
      setLoading(false);
      
      return data;
    } catch (error) {
      setError(error.message || 'Failed to fetch results');
      return [];
    }
  }, [filters, selectedCountry, selectedStreaming, setLoading, setSearchResults, setError]);
  
  // Initial data load
  useEffect(() => {
    fetchData(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);
  
  // Load more data for infinite scrolling
  const loadMoreData = useCallback(() => {
    const nextPage = pagination.page + 1;
    setPage(nextPage);
    fetchData(nextPage, false);
  }, [pagination.page, setPage, fetchData]);
  
  // Set up infinite scrolling
  const { loaderRef } = useInfiniteScroll(
    loadMoreData,
    pagination.hasMore,
    isLoading
  );
  
  // Apply filters
  const handleApplyFilters = useCallback((title, year, genres) => {
    setFilters({ title, year, genres });
    // Reset to page 1 and fetch with new filters
    setPage(1);
    fetchData(1, true);
  }, [setFilters, setPage, fetchData]);
  
  // Item selection
  const handleItemClick = useCallback(async (item) => {
    setSelectedItem(item, true);
    
    try {
      const detailedItem = await ApiService.getShowDetails(item._id || item.id, {
        country: selectedCountry?.id,
        streaming: selectedStreaming
      });
      
      setSelectedItem(detailedItem, false);
    } catch (error) {
      console.error("Error fetching details:", error);
      setSelectedItem(item, false);
    }
  }, [setSelectedItem, selectedCountry, selectedStreaming]);
  
  // Close modal
  const handleCloseModal = useCallback(() => {
    setSelectedItem(null);
  }, [setSelectedItem]);
  
  // Navigate back to home
  const handleBackToHome = useCallback(() => {
    navigate('/');
  }, [navigate]);
  
  return (
    <div className="search-page">
      <SkipLink targetId="main-content" />
      <AnimatedBackground />
      
      <ErrorBoundary>
        <SearchHeader
          country={selectedCountry?.id}
          selectedStreamingProviders={selectedStreaming}
          onLogoClick={handleBackToHome}
          titleFilter={filters.title}
          onSearch={(searchTerm) => handleApplyFilters(searchTerm, filters.year, filters.genres)}
        />
        
        <main id="main-content">
          <ResultsGrid
            data={results}
            isLoading={isLoading}
            hasMore={pagination.hasMore}
            totalResults={pagination.totalResults}
            appliedTitleFilter={filters.title}
            appliedYearFilter={filters.year}
            appliedGenreFilter={filters.genres}
            error={error}
            onItemClick={handleItemClick}
            onApplyFilters={handleApplyFilters}
            loaderRef={loaderRef}
          />
        </main>
        
        <SeriesModal
          series={selectedItem}
          streamingProviders={selectedStreaming}
          isLoadingDetails={isLoadingDetails}
          onClose={handleCloseModal}
        />
      </ErrorBoundary>
    </div>
  );
};

export default Search;