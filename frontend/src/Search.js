import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import './Search.css';

function Search() {
  const location = useLocation();
  const { country, streaming } = location.state || {};  // Extract country and streaming from state

  const [data, setData] = useState([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Fetch data based on filters, country, streaming, and page
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

      if (response.data && response.data.length > 0) {
        setData(prevData => (page === 1 ? response.data : [...prevData, ...response.data]));
        setHasMore(true);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger data fetch when filters or page change
  useEffect(() => {
    fetchData(titleFilter, yearFilter, page, country, streaming);
  }, [page, titleFilter, yearFilter, country, streaming, fetchData]);

  // Handle infinite scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 300 && !isLoading && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore]);

  // Apply filters and reset data
  const handleFilter = () => {
    setPage(1);
    setData([]);
    setHasMore(true);
  };

  // Handle item selection
  const handleItemClick = (item) => {
    setIsImageLoaded(false);
    setSelectedSeries(item);
  };

  // Close modal
  const closeModal = () => setSelectedSeries(null);

  return (
    <div className="App">
      <h1>TV Series Search</h1>

      <div className="filter-container">
        <input
          type="text"
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
          placeholder="Filter by title"
          className="filter-input"
        />
        <input
          type="text"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          placeholder="Filter by year"
          className="filter-input"
        />
        <button onClick={handleFilter} className="filter-button">Apply Filter</button>
      </div>

      <div className="grid-container">
        {data.map((item, index) => (
          <div key={index} className="grid-item" onClick={() => handleItemClick(item)}>
            <div className="image-container">
              <img
                src={`https://image.tmdb.org/t/p/w185/${item.poster_path}`}
                alt={item.title}
                className="series-image"
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
            <div className="info-container">
              <h2 className="series-title">{item.title}</h2>
              <p className="series-year">{item.year}</p>
            </div>
          </div>
        ))}
      </div>

      {isLoading && <p>Loading more results...</p>}

      {!hasMore && (
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#cb5207' }}>
          You've reached the end of the list! No more results to show. Maybe it's time to take a break? 🛋️🍿
        </p>
      )}

      {selectedSeries && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-button" onClick={closeModal}>&times;</span>
            <div className="modal-image-container">
              <img
                src={`https://image.tmdb.org/t/p/w1280/${selectedSeries.backdrop_path}`}
                alt={selectedSeries.title}
                className={`modal-image ${isImageLoaded ? 'loaded' : 'loading'}`}
                onLoad={() => setIsImageLoaded(true)}
              />
            </div>
            {isImageLoaded && (
              <div className="modal-info">
                <h2>{selectedSeries.title}</h2>
                <p><strong>Plot:</strong> {selectedSeries.plot}</p>
                <p><strong>Actors:</strong> {selectedSeries.actors ? selectedSeries.actors.join(', ') : 'N/A'}</p>
                <p><strong>Genre:</strong> {selectedSeries.genres ? selectedSeries.genres.join(', ') : 'N/A'}</p>
                <p><strong>Episode run time:</strong> {selectedSeries.episode_run_time ? selectedSeries.episode_run_time : 'N/A'}</p>
                <p><strong>Release Date:</strong> {selectedSeries.year}</p>
                <p><strong>Rating:</strong> {selectedSeries.vote_average} ({selectedSeries.vote_count} votes)</p>
                <p><strong>Total Seasons:</strong> {selectedSeries.number_of_seasons}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Search;
