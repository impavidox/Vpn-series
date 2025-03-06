import axios from 'axios';

// Base API URL
const BASE_URL = 'https://7qr7vo0030.execute-api.eu-central-1.amazonaws.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * API service for data fetching operations
 */
const ApiService = {
  /**
   * Filter shows based on criteria
   * 
   * @param {Object} filterCriteria - Criteria to filter by
   * @param {string} filterCriteria.title - Title to search for
   * @param {number} filterCriteria.year - Year to filter by
   * @param {number} filterCriteria.page - Page number
   * @param {string} filterCriteria.country - Country code to filter by
   * @param {Array} filterCriteria.streaming - Streaming providers to include
   * @param {Array} filterCriteria.genres - Genres to filter by
   * @returns {Promise<Array>} - Filtered shows data
   */
  async filterShows(filterCriteria) {
    try {
      const response = await api.post('/filter', filterCriteria);
      return response.data;
    } catch (error) {
      console.error("Error filtering shows:", error);
      throw error;
    }
  },

  /**
   * Get show details by ID
   * 
   * @param {string} showId - ID of the show to fetch
   * @returns {Promise<Object>} - Show details
   */
  async getShowDetails(showId) {
    try {
      const response = await api.get(`/shows/${showId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching show details:", error);
      throw error;
    }
  },

  /**
   * Get streaming availability for a show
   * 
   * @param {string} showId - ID of the show
   * @param {string} country - Country code to check availability
   * @returns {Promise<Object>} - Streaming availability data
   */
  async getStreamingAvailability(showId, country) {
    try {
      const response = await api.get(`/streaming/${showId}`, {
        params: { country }
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching streaming availability:", error);
      throw error;
    }
  },

  /**
   * Get available genres
   * 
   * @returns {Promise<Array>} - List of available genres
   */
  async getGenres() {
    try {
      const response = await api.get('/genres');
      return response.data;
    } catch (error) {
      console.error("Error fetching genres:", error);
      // Return our local genres in case the API call fails
      return [];
    }
  }
};

export default ApiService;