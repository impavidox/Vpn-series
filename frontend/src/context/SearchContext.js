import React, { createContext, useContext, useReducer } from 'react';
import PropTypes from 'prop-types';

// Action types
const SET_SEARCH_RESULTS = 'SET_SEARCH_RESULTS';
const SET_LOADING = 'SET_LOADING';
const SET_ERROR = 'SET_ERROR';
const SET_FILTERS = 'SET_FILTERS';
const SET_PAGINATION = 'SET_PAGINATION';
const SET_SELECTED_ITEM = 'SET_SELECTED_ITEM';
const RESET_STATE = 'RESET_STATE';

// Initial state
const initialState = {
  results: [],
  isLoading: false,
  error: null,
  filters: {
    title: '',
    year: '',
    genres: [],
  },
  pagination: {
    page: 1,
    totalResults: 0,
    hasMore: true,
  },
  selectedItem: null,
  isLoadingDetails: false,
};

/**
 * Reducer for search state management
 */
function searchReducer(state, action) {
  switch (action.type) {
    case SET_SEARCH_RESULTS:
      return {
        ...state,
        results: action.payload.reset
          ? action.payload.data
          : [...state.results, ...action.payload.data],
        pagination: {
          ...state.pagination,
          totalResults: action.payload.totalResults || state.pagination.totalResults,
          hasMore: action.payload.hasMore,
        },
      };
      
    case SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
      
    case SET_FILTERS:
      return {
        ...state,
        filters: {
          ...state.filters,
          ...action.payload,
        },
      };
      
    case SET_PAGINATION:
      return {
        ...state,
        pagination: {
          ...state.pagination,
          ...action.payload,
        },
      };
      
    case SET_SELECTED_ITEM:
      return {
        ...state,
        selectedItem: action.payload.item,
        isLoadingDetails: action.payload.isLoading,
      };
      
    case RESET_STATE:
      return initialState;
      
    default:
      return state;
  }
}

// Create context
const SearchContext = createContext();

/**
 * Provider for search state
 */
export const SearchProvider = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  
  // Actions
  const setSearchResults = (data, reset = false, totalResults = null, hasMore = true) => {
    dispatch({
      type: SET_SEARCH_RESULTS,
      payload: { data, reset, totalResults, hasMore },
    });
  };
  
  const setLoading = (isLoading) => {
    dispatch({ type: SET_LOADING, payload: isLoading });
  };
  
  const setError = (error) => {
    dispatch({ type: SET_ERROR, payload: error });
  };
  
  const setFilters = (filters) => {
    dispatch({ type: SET_FILTERS, payload: filters });
  };
  
  const setPage = (page) => {
    dispatch({ type: SET_PAGINATION, payload: { page } });
  };
  
  const setSelectedItem = (item, isLoading = false) => {
    dispatch({ 
      type: SET_SELECTED_ITEM, 
      payload: { item, isLoading } 
    });
  };
  
  const resetState = () => {
    dispatch({ type: RESET_STATE });
  };
  
  return (
    <SearchContext.Provider
      value={{
        state,
        setSearchResults,
        setLoading,
        setError,
        setFilters,
        setPage,
        setSelectedItem,
        resetState,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

SearchProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

/**
 * Custom hook to use the search context
 */
export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};

export default SearchContext;