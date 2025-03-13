/**
 * Helper utility functions for the application
 */

/**
 * Gets the full country name from a country code
 * @param {string} countryCode - The country code (e.g., 'US')
 * @param {Object} countryDict - Dictionary mapping codes to names
 * @returns {string} The full country name or original code if not found
 */
export const getCountryName = (countryCode, countryDict) => {
  if (!countryCode) return 'Global';
  return countryDict[countryCode] || countryCode;
};

/**
 * Formats results count for display
 * @param {number|string} totalResults - The total results count
 * @param {number} displayedResults - Number of currently displayed results
 * @returns {string} Formatted results count
 */
export const formatResultsCount = (totalResults, displayedResults) => {
  if (totalResults === '1000+') {
    return totalResults;
  }
  
  if (typeof totalResults === 'number' && totalResults > 0) {
    return totalResults.toString();
  }
  
  return displayedResults.toString();
};

/**
 * Filter providers based on selected streaming services
 * @param {Object} providerData - Available providers data
 * @param {Array} allowedProviders - List of selected streaming services
 * @returns {Object} Filtered providers data
 */
export const filterProviders = (providerData, allowedProviders) => {
  if (!providerData) return {};
  
  if (!allowedProviders || allowedProviders.length === 0) {
    return providerData;
  }

  return Object.fromEntries(
    Object.entries(providerData)
      .map(([country, providers]) => [
        country,
        Object.fromEntries(
          Object.entries(providers).filter(([provider]) =>
            allowedProviders.includes(provider)
          )
        ),
      ])
      .filter(([, providers]) => Object.keys(providers).length > 0)
  );
};

/**
 * Calculate maximum seasons across all providers
 * @param {Object} providers - Provider data with seasons information
 * @returns {number} The maximum number of seasons
 */
export const calculateMaxSeasons = (providers) => {
  let max = 0;
  Object.values(providers).forEach(provider => {
    const seasons = parseInt(provider.count);
    if (seasons > max) max = seasons;
  });
  return max || 1; // Avoid division by zero
};

/**
 * Safely access image URLs with proper fallbacks
 * @param {string} path - Image path
 * @param {string} size - Image size for TMDB (e.g., 'w500')
 * @param {string} fallback - Fallback URL if image not available
 * @returns {string} Complete image URL
 */
export const getImageUrl = (path, size = 'w500', fallback = 'https://via.placeholder.com/300x450?text=No+Image') => {
  if (!path) return fallback;
  return `https://image.tmdb.org/t/p/${size}/${path}`;
};

/**
 * Format date to a readable string
 * @param {string} dateString - The date string to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Default options
    const defaultOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      ...options
    };
    
    return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Format number with thousands separators
 * @param {number} num - The number to format
 * @returns {string} Formatted number
 */
export const formatNumber = (num) => {
  if (num === undefined || num === null) return '';
  return new Intl.NumberFormat('en-US').format(num);
};

/**
 * Debounce function to limit how often a function can be called
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};