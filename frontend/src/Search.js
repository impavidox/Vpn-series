import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Search.css';
import StreamingInfo from './StreamingInfo';
import countryDict from './country_dict.json';

function Search() {
  const location = useLocation();
  const navigate = useNavigate();
  const { country, streaming } = location.state || {};
  const countryName = country ? (countryDict[country] || country) : 'Global';
  
  // Refs for animations, visibility, and infinite scrolling
  const headerRef = useRef(null);
  const filtersRef = useRef(null);
  const resultsRef = useRef(null);
  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  // State variables
  const [data, setData] = useState([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [appliedTitleFilter, setAppliedTitleFilter] = useState('');
  const [appliedYearFilter, setAppliedYearFilter] = useState('');
  const [animationComplete, setAnimationComplete] = useState(false);
  const [selectedStreamingProviders, setSelectedStreamingProviders] = useState(streaming || []);
  const [totalResults, setTotalResults] = useState('1000+'); // Default to 1000+ for demonstration

  // Fetch data based on applied filters, country, streaming, and page
  const fetchData = useCallback(async (titleFilter, yearFilter, page, country, streaming) => {
    setIsLoading(true);

    try {
      const filterCriteria = {
        title: titleFilter,
        year: yearFilter ? parseInt(yearFilter, 10) : undefined,
        page,
        country,
        streaming,
      };

      const response = await axios.post('http://127.0.0.1:5000/api/filter', filterCriteria);

      // Check if the response has data
      if (response.data && response.data.length > 0) {
        // Update data based on page number
        setData(prevData => {
          if (page === 1) {
            return response.data;
          } else {
            // Make sure we don't add duplicate items when appending data
            const newData = [...prevData];
            const existingIds = new Set(prevData.map(item => item._id));
            
            response.data.forEach(item => {
              if (!existingIds.has(item._id)) {
                newData.push(item);
              }
            });
            
            return newData;
          }
        });
        
        // Determine if there are more results to load
        setHasMore(response.data.length >= 56); // Assuming 56 is the page size
        
        // For total counts - set to 1000+ if we got a full page, otherwise use actual count
        if (page === 1) {
          if (response.data.length >= 56) {
            setTotalResults('1000+');
          } else {
            setTotalResults(response.data.length);
          }
        }
      } else {
        if (page === 1) {
          setData([]);
          setTotalResults(0);
        }
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data", error);
      if (page === 1) {
        setData([]);
        setTotalResults(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up IntersectionObserver for infinite scrolling
  useEffect(() => {
    // Disconnect previous observer if it exists
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Only observe if there's more data to load
    if (!hasMore || isLoading) return;

    const options = {
      root: null, // use viewport as root
      rootMargin: '0px 0px 500px 0px', // trigger earlier, before the element is visible
      threshold: 0.1 // trigger when 10% of the target is visible
    };

    // Create new IntersectionObserver
    observerRef.current = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && !isLoading && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    }, options);

    // Start observing the loader element if it exists
    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current);
    }

    // Cleanup function
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading]);

  // Trigger data fetch only when page changes or filters are applied
  useEffect(() => {
    fetchData(appliedTitleFilter, appliedYearFilter, page, country, selectedStreamingProviders);
  }, [page, appliedTitleFilter, appliedYearFilter, country, selectedStreamingProviders, fetchData]);

  // Start animations after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // Apply filters when the button is clicked
  const handleFilter = () => {
    setAppliedTitleFilter(titleFilter);
    setAppliedYearFilter(yearFilter);
    setPage(1);  // Reset to the first page of results
    setData([]);  // Clear previous data
    setHasMore(true);  // Reset hasMore to true
  };

  // Handle item selection
  const handleItemClick = (item) => {
    setIsImageLoaded(false);
    setSelectedSeries(item);
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
  };

  // Close modal
  const closeModal = () => {
    setSelectedSeries(null);
    document.body.style.overflow = 'auto'; // Re-enable scrolling
  };

  // Navigate back to home
  const handleBackToHome = () => {
    navigate('/');
  };

  // Handle key press events for filters
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  // Format the results count display
  const formatResultsDisplay = () => {
    if (totalResults === '1000+') {
      return totalResults;
    }
    
    if (typeof totalResults === 'number' && totalResults > 0) {
      return totalResults.toString();
    }
    
    return data.length.toString();
  };

  return (
    <div className="search-page-container">
      {/* Animated background elements */}
      <div className="background-animations">
        <div className="bg-orb orb-cyan"></div>
        <div className="bg-orb orb-orange"></div>
        <div className="bg-orb orb-yellow"></div>
      </div>

      {/* Header section */}
      <div 
        ref={headerRef} 
        className={`search-header ${animationComplete ? 'animate-in' : ''}`}
      >
        <div className="search-header-content">
          <div className="logo-container" onClick={handleBackToHome}>
            <h1 className="logo">
              <span className="logo-part-1">Beyond</span>
              <span className="logo-part-2">Flix</span>
              <span className="logo-emoji">🌍</span>
            </h1>
          </div>
          
          <div className="search-info">
            <div className="search-region">
              <span className="region-icon">📍</span>
              <span className="region-text">
                Browsing content in <span className="highlight">{countryName}</span>
              </span>
            </div>
            
            <div className="search-streaming">
              <span className="streaming-icon">📺</span>
              <span className="streaming-text">
                {selectedStreamingProviders && selectedStreamingProviders.length > 0 
                  ? `Filtering for ${selectedStreamingProviders.join(', ')}`
                  : 'All streaming services'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter section */}
      <div 
        ref={filtersRef}
        className={`filter-section ${animationComplete ? 'animate-in' : ''}`}
      >
        <div className="filter-container">
          <div className="input-group">
            <span className="input-icon">🔍</span>
            <input
              type="text"
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              placeholder="Search by title"
              className="filter-input"
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <div className="input-group">
            <span className="input-icon">📅</span>
            <input
              type="text"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              placeholder="Filter by year"
              className="filter-input"
              onKeyPress={handleKeyPress}
            />
          </div>
          
          <button onClick={handleFilter} className="filter-button">
            <span className="button-text">Apply Filters</span>
          </button>
        </div>
      </div>

      {/* Results section */}
      <div 
        ref={resultsRef}
        className={`results-section ${animationComplete ? 'animate-in' : ''}`}
      >
        <div className="results-header">
          <h2>
            {data.length > 0 ? (
              <>
                <span className="results-count">{formatResultsDisplay()}</span> shows found
                {appliedTitleFilter && ` for "${appliedTitleFilter}"`}
                {appliedYearFilter && ` in ${appliedYearFilter}`}
                {totalResults !== '1000+' && data.length < totalResults && 
                  <span className="showing-count"> (Showing {data.length})</span>
                }
                {totalResults === '1000+' && 
                  <span className="showing-count"> (Showing {data.length})</span>
                }
              </>
            ) : isLoading && page === 1 ? (
              'Searching for content...'
            ) : (
              'Ready to discover shows'
            )}
          </h2>
        </div>

        <div className="grid-container">
  {data.map((item, index) => (
    <div 
      key={`${item._id || item.id || index}`} 
      className="grid-item visible"
      onClick={() => handleItemClick(item)}
    >
      <div className="image-container">
        <img
          src={`https://image.tmdb.org/t/p/w500/${item.poster_path || 'placeholder.jpg'}`}
          alt={item.title}
          className="series-image"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/300x450?text=No+Image';
          }}
        />
        <div className="rating-badge">{item.vote_average?.toFixed(1) || '?'}</div>
        
        {/* Add hover content with scrollbar */}
        <div className="item-hover-content">
          <div className="hover-genres">
            {item.genres?.slice(0, 3).map((genre, idx) => (
              <span key={idx} className="hover-genre-tag">{genre}</span>
            )) || <span className="hover-genre-tag">Unknown Genre</span>}
          </div>
          <div className="hover-overview">
            {item.plot?.substring(0, 150) || 'No overview available.'}
            {item.plot?.length > 150 ? '...' : ''}
          </div>
        </div>
      </div>
      
      <div className="info-container">
        <h2 className="series-title">{item.title}</h2>
        <p className="series-year">{item.year}</p>
      </div>
    </div>
  ))}
</div>

        {/* Loader element for intersection observer */}
        <div 
          ref={loaderRef} 
          className={`loader-element ${isLoading ? 'loading' : ''}`}
        >
          {isLoading && (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading more amazing content...</p>
            </div>
          )}
        </div>

        {!hasMore && data.length > 0 && (
          <div className="end-results-message">
            <span className="end-icon">🎬</span>
            <p>You've reached the end of the list! No more results to show.</p>
            <p className="end-suggestion">Maybe it's time to take a break? 🛋️🍿</p>
          </div>
        )}

        {!isLoading && data.length === 0 && !hasMore && (
          <div className="no-results-message">
            <span className="no-results-icon">🔍</span>
            <p>No shows found matching your criteria.</p>
            <p>Try adjusting your filters or exploring different streaming services.</p>
          </div>
        )}
      </div>

      {/* Modal for show details */}
      {selectedSeries && (
        <div className="modal-overlay" onClick={closeModal}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-button" onClick={closeModal}>
              <span>×</span>
            </button>
            
            <div className="modal-image-container">
              <img
                src={`https://image.tmdb.org/t/p/w1280/${selectedSeries.backdrop_path || selectedSeries.poster_path}`}
                alt={selectedSeries.title}
                className={`modal-image ${isImageLoaded ? 'loaded' : 'loading'}`}
                onLoad={() => setIsImageLoaded(true)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/1280x720?text=No+Image+Available';
                }}
              />
              <div className="modal-gradient-overlay"></div>
              <div className="modal-title-banner">
                <h1>{selectedSeries.title}</h1>
                <div className="modal-meta">
                  <span className="modal-year">{selectedSeries.year}</span>
                  <span className="separator">•</span>
                  <span className="modal-rating">
                    ⭐ {selectedSeries.vote_average} ({selectedSeries.vote_count} votes)
                  </span>
                  <span className="separator">•</span>
                  <span className="modal-seasons">
                    {selectedSeries.number_of_seasons} Season{selectedSeries.number_of_seasons !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="modal-details">
              <div className="modal-section">
                <h3 className="section-title">Overview</h3>
                <p className="modal-plot">{selectedSeries.plot || 'No overview available.'}</p>
              </div>
              
              <div className="modal-section">
                <h3 className="section-title">Details</h3>
                <div className="modal-details-grid">
                  {selectedSeries.genres && selectedSeries.genres.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Genre</span>
                      <div className="detail-value genre-tags">
                        {selectedSeries.genres.map((genre, idx) => (
                          <span key={idx} className="genre-tag">{genre}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedSeries.actors && selectedSeries.actors.length > 0 && (
                    <div className="detail-item">
                      <span className="detail-label">Cast</span>
                      <span className="detail-value">{selectedSeries.actors.join(', ')}</span>
                    </div>
                  )}
                  
                  {selectedSeries.episode_run_time && (
                    <div className="detail-item">
                      <span className="detail-label">Episode Length</span>
                      <span className="detail-value">{selectedSeries.episode_run_time} min</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Streaming Information */}
              <div className="modal-section">
                <h3 className="section-title">Where to Watch</h3>
                <StreamingInfo 
                  selectedSeries={selectedSeries} 
                  streaming={selectedStreamingProviders} 
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;