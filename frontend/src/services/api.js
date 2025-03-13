import axios from 'axios';

// Base API URL
const BASE_URL = 'https://906j76kjqe.execute-api.eu-central-1.amazonaws.com/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor for logging and adding auth if needed
api.interceptors.request.use(
  (config) => {
    // You could add authorization headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    const errorResponse = {
      message: 'An unexpected error occurred',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };
    
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      switch (error.response.status) {
        case 401:
          errorResponse.message = 'Unauthorized - Please login again';
          break;
        case 403:
          errorResponse.message = 'Forbidden - You do not have permission';
          break;
        case 404:
          errorResponse.message = 'Resource not found';
          break;
        case 429:
          errorResponse.message = 'Too many requests - Please try again later';
          break;
        case 500:
          errorResponse.message = 'Server error - Please try again later';
          break;
        default:
          errorResponse.message = error.response.data?.message || 'An error occurred';
      }
    } else if (error.request) {
      // Request was made but no response received
      errorResponse.message = 'Network error - Please check your connection';
    }
    
    console.error('API Error:', errorResponse);
    return Promise.reject(errorResponse);
  }
);

/**
 * API service with improved error handling and retries
 */
const ApiService = {
  /**
   * Filter shows based on criteria
   */
  async filterShows(filterCriteria, retries = 1) {
    try {
      const response = await api.post('/filter', filterCriteria);
      return response.data;
    } catch (error) {
      // Implement retry logic for network errors
      if (retries > 0 && (!error.status || error.status >= 500)) {
        console.log(`Retrying request, ${retries} attempts left`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.filterShows(filterCriteria, retries - 1);
      }
      throw error;
    }
  },

  /**
   * Get show details by ID
   */
  async getShowDetails(showId, options = {}) {
    try {
      const response = await api.get(`/shows/${showId}`, { 
        params: {
          country: options.country,
          streaming: options.streaming ? options.streaming.join(',') : undefined
        } 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Batch get detailed information for multiple shows at once
   */
  async batchGetShowDetails(criteria) {
    try {
      const response = await api.post('/shows/batch', criteria);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get streaming availability for a show
   */
  async getStreamingAvailability(showId, country) {
    try {
      const response = await api.get(`/streaming/${showId}`, {
        params: { country }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get available genres
   */
  async getGenres() {
    try {
      const response = await api.get('/genres');
      return response.data;
    } catch (error) {
      console.error("Error fetching genres:", error);
      return [];
    }
  }
};

export default ApiService;