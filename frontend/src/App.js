import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Import custom CSS

function App() {
  const [data, setData] = useState([]);
  const [titleFilter, setTitleFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [selectedSeries, setSelectedSeries] = useState(null);
  const [isImageLoaded, setIsImageLoaded] = useState(false); // New state for image loading
  const [isGridLoaded, setIsGridLoaded] = useState(0)
  const [previoustitleFilter, setpreviousTitleFilter] = useState('');
  const [previousyearFilter, setpreviousYearFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const filterCriteria = {};
        const response = await axios.post('http://127.0.0.1:5000/api/filter', filterCriteria); // Replace with your initial data endpoint
        setData(response.data);
      } catch (error) {
        console.error("Error fetching initial data", error);
      }
    };

    fetchData();
  }, []);

  const handleFilter = async () => {

    if (!(previoustitleFilter===titleFilter && previousyearFilter===yearFilter)){
      setIsGridLoaded(0);
    }
    handleFilterChangeTitle()
    handleFilterChangeYear()
    try {
      const filterCriteria = {};
      if (titleFilter) {
        filterCriteria.title = titleFilter;
      }
      if (yearFilter) {
        filterCriteria.year = parseInt(yearFilter, 10);
      }
      const response = await axios.post('http://127.0.0.1:5000/api/filter', filterCriteria);
      setData(response.data);
    } catch (error) {
      console.error("Error filtering data", error);
    }
  };

  const handleItemClick = (item) => {
    setIsImageLoaded(false); // Reset the image loaded state
    setSelectedSeries(item);
  };

  const closeModal = () => {
    setSelectedSeries(null);
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true); // Set the image loaded state to true
  };

  const handleGridLoad = () => {
    setIsGridLoaded(prevCount => prevCount + 1); // Set the image loaded state to true
  };

  const handleFilterChangeYear = () => {
    setpreviousYearFilter(yearFilter);
  };

  const handleFilterChangeTitle = () => {
    setpreviousTitleFilter(titleFilter)
  };

  return (
    <div style={{backgroundColor:'#121212'}}>
      <div className="App" style={{ opacity: isGridLoaded===56 ? 1 : 0,  transition: 'opacity 0.5s ease-in-out'}}>
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

        <div className="grid-container" style={{backgroundColor:'#121212', opacity: isGridLoaded===56 ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}>
          {data.map((item, index) => (
            <div key={index} className="grid-item" onClick={() => handleItemClick(item)}>
              <div className="image-container">
                <img src={"https://image.tmdb.org/t/p/w185/" + item.poster_path} alt={item.title} className="series-image" onLoad={handleGridLoad}/>
              </div>
              <div className="info-container">
                <h2 className="series-title">{item.title}</h2>
                <p className="series-year">{item.year}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedSeries && (
          <div className="modal-overlay" onClick={closeModal} style={{ opacity: isImageLoaded ? 1 : 0, transition: 'opacity 0.5s ease-in-out' }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} >
              <span className="close-button" onClick={closeModal}>&times;</span>
              <div className="modal-image-container">
                <img 
                  src={"https://image.tmdb.org/t/p/w1280/" + selectedSeries.backdrop_path} 
                  alt={selectedSeries.title} 
                  className={`modal-image ${isImageLoaded ? 'loaded' : 'loading'}`} 
                  onLoad={handleImageLoad} 
                />
              </div>
              {isImageLoaded && (  /* Only display the info when the image is loaded */
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
    </div>
  );
}

export default App;
