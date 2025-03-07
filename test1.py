import requests
import time
import json
import os
import logging
from pymongo import MongoClient, UpdateOne
from pymongo.errors import BulkWriteError
from concurrent.futures import ThreadPoolExecutor
import urllib.parse
import datetime
import random
import socket
from typing import List, Dict, Any, Union, Optional

# TMDB Content Scraper - Combined TV Shows and Movies
# ======================================================
# This script fetches and processes content from TMDB API 
# for both TV shows and movies, storing the data in a single MongoDB collection.
#
# Features:
# - Discovers new TV shows and movies based on popularity/vote count
# - Enriches content with detailed metadata (genres, cast, etc.)
# - Collects streaming provider availability across different countries
# - Distributes workload across multiple workers efficiently
# - For TV shows: Workers are distributed by page numbers
# - For movies: Workers are distributed by release years
#
# Environment Variables:
# TMDB_API_KEY         - Your TMDB API key (Required)
# MONGO_URI            - MongoDB connection string (Required)
# MONGO_DB             - MongoDB database name
# MONGO_COLLECTION     - Collection name for all content
# CONTENT_TYPE         - What to process: 'tv', 'movies', or 'both'
# PROCESS_TYPE         - Processing mode: 'discover', 'enrich', 'providers', 'update_indexes', or 'full'
# MAX_WORKERS          - Max concurrent threads per worker
# BATCH_SIZE           - Items to process in a single batch
# RATE_LIMIT_DELAY     - Delay between API calls to avoid rate limiting
# START_PAGE           - Starting page for discovery
# END_PAGE             - Ending page for discovery
# PROVIDER_REFRESH_DAYS - Days before refreshing provider data
# ENRICHMENT_REFRESH_DAYS - Days before refreshing enrichment data
# MOVIE_START_YEAR     - Earliest year to fetch movies from
# MOVIE_END_YEAR       - Latest year to fetch movies from
# TOTAL_WORKERS        - Total number of worker instances
# INSTANCE_ID          - Unique ID for this worker instance

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger()

# Constants and configurations
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTU5OC4yMTc0OTEsInN1YiI6IjY2Y2U1YTAxYWFjOTVjODg4YTY2ZDViOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.D1IRi_GiU_9BLWXbl2jGApNVYL_bMDGBPONBvs0XZaE')
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
MONGO_DB = os.environ.get('MONGO_DB', 'vpn-series-db')
MONGO_COLLECTION = os.environ.get('MONGO_COLLECTION', 'content_collection')
MAX_WORKERS = int(os.environ.get('MAX_WORKERS', '20'))
BATCH_SIZE = int(os.environ.get('BATCH_SIZE', '25'))
RATE_LIMIT_DELAY = float(os.environ.get('RATE_LIMIT_DELAY', '0.1'))
PROCESS_TYPE = os.environ.get('PROCESS_TYPE', 'full')  # Options: discover, enrich, providers, update_indexes
START_PAGE = int(os.environ.get('START_PAGE', '1'))
END_PAGE = int(os.environ.get('END_PAGE', '500'))  # Adjust based on your needs
PROVIDER_REFRESH_DAYS = int(os.environ.get('PROVIDER_REFRESH_DAYS', '7'))
ENRICHMENT_REFRESH_DAYS_TV = int(os.environ.get('ENRICHMENT_REFRESH_DAYS_TV', '30'))
ENRICHMENT_REFRESH_DAYS_MOVIE = int(os.environ.get('ENRICHMENT_REFRESH_DAYS_MOVIE', '90'))  # Movies change less frequently
CONTENT_TYPE = os.environ.get('CONTENT_TYPE', 'both')  # Options: tv, movies, both
MOVIE_START_YEAR = int(os.environ.get('MOVIE_START_YEAR', '1990'))
MOVIE_END_YEAR = int(os.environ.get('MOVIE_END_YEAR', datetime.datetime.now().year))

headers = {
    "accept": "application/json",
    "Authorization": f"Bearer {TMDB_API_KEY}"
}

# Setup MongoDB client
try:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
    collection = db[MONGO_COLLECTION]
    logger.info(f"Connected to MongoDB: {MONGO_DB}.{MONGO_COLLECTION}")
    
    # Create indexes for efficient querying
    collection.create_index("id", unique=True)  # TMDB ID
    collection.create_index("content_type")  # TV or movie
    collection.create_index("title")  # For title searches
    collection.create_index("original_title")  # For original title searches
    collection.create_index([("title", "text"), ("original_title", "text")])  # Text search across both fields
    collection.create_index("enrichment_status")
    collection.create_index("provider_status")
    collection.create_index([("enrichment_status", 1), ("enrichment_updated_at", 1)])
    collection.create_index([("provider_status", 1), ("provider_updated_at", 1)])
    collection.create_index([("content_type", 1), ("release_year", 1)])  # For movie year queries
    logger.info("MongoDB indexes created or already exist")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {e}")
    raise

# Create session for API requests with connection pooling
session = requests.Session()

# Cache for countries to avoid repeated API calls
countries_cache = None

def load_countries():
    """Fetch countries from TMDB API with caching."""
    global countries_cache
    
    if countries_cache:
        return countries_cache
        
    url = "https://api.themoviedb.org/3/watch/providers/regions"
    try:
        response = session.get(url, headers=headers)
        response.raise_for_status()
        countries_data = response.json()
        
        countries_list = [country['iso_3166_1'] for country in countries_data.get('results', [])]
        logger.info(f"Loaded {len(countries_list)} countries from TMDB API")
        
        countries_cache = countries_list
        return countries_list
    except Exception as e:
        logger.error(f"Error fetching countries: {e}")
        # Return a minimal default list in case of failure
        default_countries = ["US", "GB", "CA", "AU", "DE", "FR", "JP"]
        countries_cache = default_countries
        return default_countries

def chunk_list(lst, chunk_size):
    """Split a list into chunks of specified size."""
    for i in range(0, len(lst), chunk_size):
        yield lst[i:i + chunk_size]

def batch_write_to_mongodb(items, update=False):
    """
    Write multiple items to MongoDB in batches.
    
    Args:
        items (list): List of items to write
        update (bool): If True, items are update operations
    """
    if not items:
        return
        
    try:
        if update:
            # For updates, use bulk operations
            bulk_operations = items
            result = collection.bulk_write(bulk_operations, ordered=False)
            logger.info(f"Bulk updated {result.modified_count} items in MongoDB")
        else:
            # For new items, use insert_many with ordered=False to continue on error
            result = collection.insert_many(items, ordered=False)
            logger.info(f"Inserted {len(result.inserted_ids)} items to MongoDB")
    except BulkWriteError as bwe:
        # Handle duplicate key errors
        logger.warning(f"Bulk write completed with some errors: {bwe.details['nInserted']} inserted, "
                      f"{bwe.details['nModified']} modified, {len(bwe.details['writeErrors'])} errors")
    except Exception as e:
        logger.error(f"Error in batch write: {e}")
        # If batch write fails, try individual writes
        logger.info("Falling back to individual writes")
        
        successful = 0
        for item in items:
            try:
                if update:
                    # For update operations
                    collection.update_one(
                        {"id": item['filter']['id']},  # Use TMDB id for matching
                        item['update']
                    )
                else:
                    # For insert operations
                    collection.insert_one(item)
                successful += 1
            except Exception as e2:
                logger.error(f"Failed to write item {item.get('id', 'unknown')}: {e2}")
        
        logger.info(f"Completed {successful}/{len(items)} individual writes")
        
def fetch_with_retry(url, max_retries=3, backoff_factor=1.5):
    """Fetch data from URL with retry and exponential backoff."""
    retries = 0
    while retries < max_retries:
        try:
            response = session.get(url, headers=headers)
            
            # Check for rate limiting
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 1))
                logger.warning(f"Rate limited, waiting for {retry_after} seconds")
                time.sleep(retry_after)
                retries += 1
                continue

            if response.status_code == 404:
                return {"results": {}}
                
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            wait_time = backoff_factor ** retries
            logger.warning(f"Request failed: {e}. Retrying in {wait_time:.2f} seconds...")
            time.sleep(wait_time)
            retries += 1
    
    logger.error(f"Failed to fetch {url} after {max_retries} retries")
    return {"results": {}}

def fetch_tv_page(page):
    """Fetch a single page of TV series from TMDB API."""
    url = f'https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page={page}&sort_by=vote_count.desc&vote_count.gte=50'
    return fetch_with_retry(url)

def fetch_movie_page(page, year=None):
    """Fetch a single page of movies from TMDB API."""
    base_url = f'https://api.themoviedb.org/3/discover/movie?include_adult=false&include_video=false&language=en-US&page={page}&sort_by=vote_count.desc&vote_count.gte=100'
    
    # Add year filter if specified
    if year:
        # Filter by primary_release_year for exact year match
        url = f'{base_url}&primary_release_year={year}'
    else:
        url = base_url
        
    return fetch_with_retry(url)

def discover_and_store_tv(pages_range):
    """Discover TV series from TMDB API and store them in MongoDB."""
    logger.info(f"Discovering TV series for pages {pages_range}")
    
    for page in pages_range:
        response = fetch_tv_page(page)
        results = response.get('results', [])
        
        if not results:
            logger.info(f"TV Page {page} returned no results")
            continue
            
        # Process and store new items directly
        new_items = []
        for item in results:
            tmdb_id = str(item['id'])
            
            try:
                # Check if this item already exists 
                existing = collection.find_one({"id": tmdb_id}, {"id": 1})
                
                # If item doesn't exist, add it to our new items batch
                if not existing:
                    new_items.append({
                        'id': tmdb_id,  # Preserve TMDB ID as a separate field
                        'title': item['name'],
                        'original_title': item.get('original_name', item['name']),  # Get original title
                        'enrichment_status': 'NEEDS_UPDATE',
                        'provider_status': 'NEEDS_UPDATE',
                        'discovery_date': int(time.time()),
                        'content_type': 'tv'
                    })
                    
            except Exception as e:
                logger.error(f"Error checking TV item existence: {e}")
        
        # Store new items in batches
        if new_items:
            logger.info(f"Storing {len(new_items)} new TV items from page {page}")
            for items_batch in chunk_list(new_items, BATCH_SIZE):
                batch_write_to_mongodb(items_batch)
        else:
            logger.info(f"No new TV items to store from page {page}")
            
        # Add a small delay to avoid rate limiting
        time.sleep(RATE_LIMIT_DELAY)

def discover_and_store_movies(pages_range, year=None):
    """Discover movies from TMDB API and store them in MongoDB."""
    year_str = f" for year {year}" if year else ""
    logger.info(f"Discovering movies{year_str} for pages {pages_range}")
    
    for page in pages_range:
        response = fetch_movie_page(page, year)
        results = response.get('results', [])
        
        if not results:
            logger.info(f"Movie Page {page}{year_str} returned no results")
            continue
            
        # Process and store new items directly
        new_items = []
        for item in results:
            tmdb_id = str(item['id'])
            
            try:
                # Check if this item already exists 
                existing = collection.find_one({"id": tmdb_id}, {"id": 1})
                
                # Get release year from release_date
                release_year = None
                if item.get('release_date') and item['release_date']:
                    parts = item['release_date'].split('-')
                    if len(parts) > 0:
                        release_year = int(parts[0])
                
                # If item doesn't exist, add it to our new items batch
                if not existing:
                    new_items.append({
                        'id': tmdb_id,  # Preserve TMDB ID as a separate field
                        'title': item['title'],
                        'original_title': item.get('original_title', item['title']),  # Get original title
                        'release_year': release_year,
                        'enrichment_status': 'NEEDS_UPDATE',
                        'provider_status': 'NEEDS_UPDATE',
                        'discovery_date': int(time.time()),
                        'content_type': 'movie'
                    })
                    
            except Exception as e:
                logger.error(f"Error checking movie item existence: {e}")
        
        # Store new items in batches
        if new_items:
            logger.info(f"Storing {len(new_items)} new movie items from page {page}{year_str}")
            for items_batch in chunk_list(new_items, BATCH_SIZE):
                batch_write_to_mongodb(items_batch)
        else:
            logger.info(f"No new movie items to store from page {page}{year_str}")
            
        # Add a small delay to avoid rate limiting
        time.sleep(RATE_LIMIT_DELAY)

def fetch_items_needing_enrichment_refresh(content_type=None):
    """
    Fetch items that need basic data refreshed.
    
    Args:
        content_type (str, optional): Filter by content type ('tv' or 'movie')
                                     If None, fetch all content types
    """
    items_list = []
    
    # Current timestamp for age comparison
    current_time = int(time.time())
    
    # Use different refresh thresholds for TV shows vs movies
    if content_type == 'movie':
        # Movies change less frequently - use longer period
        refresh_threshold = ENRICHMENT_REFRESH_DAYS_MOVIE * 24 * 60 * 60
    else:
        # TV shows - use standard period
        refresh_threshold = ENRICHMENT_REFRESH_DAYS_TV * 24 * 60 * 60
        
    threshold_time = current_time - refresh_threshold
    
    try:
        # Build the query based on content type
        query = {"enrichment_status": "NEEDS_UPDATE"}
        if content_type:
            query["content_type"] = content_type
            
        # First, query items with enrichment_status = 'NEEDS_UPDATE'
        cursor = collection.find(
            query, 
            {"id": 1, "title": 1, "content_type": 1, "number_of_seasons": 1, "release_year": 1}
        )
        
        for doc in cursor:
            items_list.append(doc)
        
        # Next, query items that are outdated
        query = {
            "enrichment_status": "UPDATED",
            "enrichment_updated_at": {"$lt": threshold_time}
        }
        if content_type:
            query["content_type"] = content_type
            
        cursor = collection.find(
            query,
            {"id": 1, "title": 1, "content_type": 1, "number_of_seasons": 1, "release_year": 1}
        )
        
        for doc in cursor:
            items_list.append(doc)
            
    except Exception as e:
        logger.error(f"Error querying MongoDB for items needing enrichment: {e}")
    
    if content_type:
        logger.info(f"Found {len(items_list)} {content_type} items needing data enrichment refresh")
    else:
        logger.info(f"Found {len(items_list)} items needing data enrichment refresh")
        
    return items_list

def fetch_items_needing_provider_refresh(content_type=None):
    """
    Fetch items that need provider data refreshed.
    
    Args:
        content_type (str, optional): Filter by content type ('tv' or 'movie')
                                     If None, fetch all content types
    """
    items_list = []
    
    # Current timestamp for age comparison
    current_time = int(time.time())
    # Refresh threshold - 7 days in seconds
    refresh_threshold = PROVIDER_REFRESH_DAYS * 24 * 60 * 60
    threshold_time = current_time - refresh_threshold
    
    try:
        # Build the query based on content type
        query = {"provider_status": "NEEDS_UPDATE"}
        if content_type:
            query["content_type"] = content_type
            
        # First, query items with provider_status = 'NEEDS_UPDATE'
        cursor = collection.find(
            query, 
            {"id": 1, "title": 1, "content_type": 1, "number_of_seasons": 1, "release_year": 1}
        )
        
        for doc in cursor:
            items_list.append(doc)
        
        # Next, query items that are outdated
        query = {
            "provider_status": "UPDATED",
            "provider_updated_at": {"$lt": threshold_time}
        }
        if content_type:
            query["content_type"] = content_type
            
        cursor = collection.find(
            query,
            {"id": 1, "title": 1, "content_type": 1, "number_of_seasons": 1, "release_year": 1}
        )
        
        for doc in cursor:
            items_list.append(doc)
            
    except Exception as e:
        logger.error(f"Error querying MongoDB for items needing provider refresh: {e}")
    
    if content_type:
        logger.info(f"Found {len(items_list)} {content_type} items needing provider data refresh")
    else:
        logger.info(f"Found {len(items_list)} items needing provider data refresh")
        
    return items_list

def enrich_series_data(series_batch):
    """Fetch detailed data for a batch of TV series and prepare MongoDB updates."""
    updates = []
    current_time = int(time.time())
    
    for series in series_batch:
        series_id = series['id']
        url = f"https://api.themoviedb.org/3/tv/{series_id}?append_to_response=credits&language=en-US"
        
        try:
            response = fetch_with_retry(url)
            
            # Extract episode_run_time safely
            episode_run_time = 0
            if response.get('episode_run_time') and len(response.get('episode_run_time')) > 0:
                episode_run_time = response['episode_run_time'][0]
            
            # Get year from first_air_date
            year = None
            if response.get('first_air_date') and response['first_air_date']:
                parts = response['first_air_date'].split('-')
                if len(parts) > 0:
                    year = parts[0]
            
            # Extract actors safely
            actors = []
            if response.get('credits') and response['credits'].get('cast'):
                actors = [actor['name'] for actor in response['credits']['cast'][:3]]
            
            # Prepare update for MongoDB
            update_data = {
                "backdrop_path": response.get('backdrop_path', ''),
                "episode_run_time": episode_run_time,
                "genres": [genre['name'] for genre in response.get('genres', [])],
                "number_of_episodes": response.get('number_of_episodes', 0),
                "number_of_seasons": response.get('number_of_seasons', 0),
                "popularity": response.get('popularity', 0),
                "poster_path": response.get('poster_path', ''),
                "vote_average": response.get('vote_average', 0),
                "vote_count": response.get('vote_count', 0),
                "plot": response.get('overview', ''),
                "actors": actors,
                "year": year,
                "enrichment_updated_at": current_time,
                "enrichment_status": "UPDATED",
                "content_type": "tv"
            }
            
            updates.append(UpdateOne(
                {"id": series_id},  # Use TMDB ID for matching
                {"$set": update_data}
            ))
            
            # Add a small delay to avoid rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
        except Exception as e:
            logger.error(f"Error enriching series {series_id}: {e}")
    
    return updates

def enrich_movie_data(movie_batch):
    """Fetch detailed data for a batch of movies and prepare MongoDB updates."""
    updates = []
    current_time = int(time.time())
    
    for movie in movie_batch:
        movie_id = movie['id']
        url = f"https://api.themoviedb.org/3/movie/{movie_id}?append_to_response=credits&language=en-US"
        
        try:
            response = fetch_with_retry(url)
            
            # Get runtime
            runtime = response.get('runtime', 0)
            
            # Get year from release_date
            year = None
            if response.get('release_date') and response['release_date']:
                parts = response['release_date'].split('-')
                if len(parts) > 0:
                    year = int(parts[0])
            
            # Extract actors safely
            actors = []
            if response.get('credits') and response['credits'].get('cast'):
                actors = [actor['name'] for actor in response['credits']['cast'][:3]]
            
            # Prepare update for MongoDB
            update_data = {
                "backdrop_path": response.get('backdrop_path', ''),
                "runtime": runtime,
                "genres": [genre['name'] for genre in response.get('genres', [])],
                "release_date": response.get('release_date', ''),
                "release_year": year,
                "popularity": response.get('popularity', 0),
                "poster_path": response.get('poster_path', ''),
                "vote_average": response.get('vote_average', 0),
                "vote_count": response.get('vote_count', 0),
                "plot": response.get('overview', ''),
                "actors": actors,
                "enrichment_updated_at": current_time,
                "enrichment_status": "UPDATED",
                "content_type": "movie"
            }
            
            updates.append(UpdateOne(
                {"id": movie_id},  # Use TMDB ID for matching
                {"$set": update_data}
            ))
            
            # Add a small delay to avoid rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
        except Exception as e:
            logger.error(f"Error enriching movie {movie_id}: {e}")
    
    return updates

def process_season_data(series_id, season_num, countries_list):
    """Process provider data for a single season of a series."""
    url = f"https://api.themoviedb.org/3/tv/{series_id}/season/{season_num}/watch/providers?language=en-US"
    season_data = fetch_with_retry(url)
    
    # Initialize the provider data dictionary
    provider_data = {country: {} for country in countries_list}
    
    for country, country_data in season_data.get('results', {}).items():
        if country not in provider_data:
            continue  # Skip countries not in our list
        
        # Process different provider types: flatrate, rent, buy
        for provider_type in ['flatrate', 'rent', 'buy']:
            providers = country_data.get(provider_type, [])
            for provider in providers:
                provider_name = provider['provider_name']
                provider_id = str(provider['provider_id'])
                
                # Create a unique key for provider+type
                provider_key = f"{provider_name}_{provider_type}"
                
                if provider_key not in provider_data[country]:
                    provider_data[country][provider_key] = {
                        'count': 0,
                        'provider_id': provider_id,
                        'provider_name': provider_name,
                        'type': provider_type
                    }
                provider_data[country][provider_key]['count'] += 1
    
    return provider_data

def process_tv_provider_data(series_batch):
    """Process provider data for a batch of TV series."""
    updates = []
    countries_list = load_countries()
    current_time = int(time.time())
    
    for series in series_batch:
        series_id = series['id']
        
        try:
            # Get number of seasons
            seasons_count = series.get('number_of_seasons', 0)
            if not isinstance(seasons_count, int):
                # Convert to int if it's another type
                try:
                    seasons_count = int(seasons_count)
                except:
                    seasons_count = 0
                
            if seasons_count <= 0:
                logger.info(f"Skipping series {series_id}: No seasons available")
                continue
                
            logger.info(f"Processing provider data for series {series_id} with {seasons_count} seasons")
            
            # Process each season in sequence to avoid rate limiting
            all_seasons_data = []
            for season in range(1, seasons_count + 1):
                season_data = process_season_data(series_id, season, countries_list)
                all_seasons_data.append(season_data)
                time.sleep(RATE_LIMIT_DELAY)
            
            # Aggregate provider data across all seasons
            aggregated_data = {country: {} for country in countries_list}
            
            for season_result in all_seasons_data:
                for country, providers in season_result.items():
                    for provider_key, provider_info in providers.items():
                        if provider_key not in aggregated_data[country]:
                            aggregated_data[country][provider_key] = provider_info.copy()
                        else:
                            aggregated_data[country][provider_key]['count'] += provider_info['count']
            
            # Format for MongoDB
            formatted_data = {}
            for country, providers in aggregated_data.items():
                if providers:  # Only include countries with data
                    country_providers = {}
                    for provider_info in providers.values():
                        # Extract provider name to use as key
                        provider_name = provider_info.pop('provider_name')
                        # Add the rest of the provider info as the value
                        country_providers[provider_name] = provider_info
                    
                    formatted_data[country] = country_providers
            
            # Prepare the update
            updates.append(UpdateOne(
                {"id": series_id},  # Use TMDB ID for matching
                {"$set": {
                    "provider_data": formatted_data,
                    "provider_updated_at": current_time,
                    "provider_status": "UPDATED"
                }}
            ))
            
        except Exception as e:
            logger.error(f"Error processing provider data for series {series_id}: {e}")
    
    return updates

def process_movie_provider_data(movie_batch):
    """Process provider data for a batch of movies."""
    updates = []
    countries_list = load_countries()
    current_time = int(time.time())
    
    for movie in movie_batch:
        movie_id = movie['id']
        
        try:
            logger.info(f"Processing provider data for movie {movie_id}")
            
            # Get provider data for the movie
            url = f"https://api.themoviedb.org/3/movie/{movie_id}/watch/providers?language=en-US"
            provider_data = fetch_with_retry(url)
            
            # Initialize the provider data dictionary
            formatted_data = {}
            
            # Process provider data for each country
            for country, country_data in provider_data.get('results', {}).items():
                if country not in countries_list:
                    continue  # Skip countries not in our list
                
                country_providers = {}
                
                # Process different provider types: flatrate, rent, buy
                for provider_type in ['flatrate', 'rent', 'buy']:
                    providers = country_data.get(provider_type, [])
                    for provider in providers:
                        provider_name = provider['provider_name']
                        provider_id = str(provider['provider_id'])
                        
                        if provider_name not in country_providers:
                            country_providers[provider_name] = {
                                'provider_id': provider_id,
                                'type': provider_type,
                                'count': 1  # Always 1 for movies as there are no seasons
                            }
                
                if country_providers:  # Only include countries with data
                    formatted_data[country] = country_providers
            
            # Prepare the update
            updates.append(UpdateOne(
                {"id": movie_id},  # Use TMDB ID for matching
                {"$set": {
                    "provider_data": formatted_data,
                    "provider_updated_at": current_time,
                    "provider_status": "UPDATED"
                }}
            ))
            
            # Add a small delay to avoid rate limiting
            time.sleep(RATE_LIMIT_DELAY)
            
        except Exception as e:
            logger.error(f"Error processing provider data for movie {movie_id}: {e}")
    
    return updates

def process_worker(worker_id, job_type, item_chunks, content_type=None):
    """
    Worker function that processes chunks of items based on job type.
    
    Args:
        worker_id (int): ID of the worker
        job_type (str): Type of job to perform ('enrich' or 'providers')
        item_chunks (list): List of item chunks to process
        content_type (str, optional): Type of content ('tv' or 'movie')
    """
    logger.info(f"Worker {worker_id} starting, processing {len(item_chunks)} chunks of type {job_type} for content_type {content_type}")
    
    for chunk in item_chunks:
        if job_type == 'enrich':
            if content_type == 'tv' or (content_type is None and all(item.get('content_type', 'tv') == 'tv' for item in chunk)):
                updates = enrich_series_data(chunk)
            elif content_type == 'movie' or (content_type is None and all(item.get('content_type', '') == 'movie' for item in chunk)):
                updates = enrich_movie_data(chunk)
            else:
                # Mixed content types, process separately
                tv_items = [item for item in chunk if item.get('content_type', 'tv') == 'tv']
                movie_items = [item for item in chunk if item.get('content_type', '') == 'movie']
                
                updates = []
                if tv_items:
                    updates.extend(enrich_series_data(tv_items))
                if movie_items:
                    updates.extend(enrich_movie_data(movie_items))
                
            batch_write_to_mongodb(updates, update=True)
            
        elif job_type == 'providers':
            if content_type == 'tv' or (content_type is None and all(item.get('content_type', 'tv') == 'tv' for item in chunk)):
                updates = process_tv_provider_data(chunk)
            elif content_type == 'movie' or (content_type is None and all(item.get('content_type', '') == 'movie' for item in chunk)):
                updates = process_movie_provider_data(chunk)
            else:
                # Mixed content types, process separately
                tv_items = [item for item in chunk if item.get('content_type', 'tv') == 'tv']
                movie_items = [item for item in chunk if item.get('content_type', '') == 'movie']
                
                updates = []
                if tv_items:
                    updates.extend(process_tv_provider_data(tv_items))
                if movie_items:
                    updates.extend(process_movie_provider_data(movie_items))
                
            batch_write_to_mongodb(updates, update=True)
            
        # Add a small delay between chunks
        time.sleep(RATE_LIMIT_DELAY)
    
    logger.info(f"Worker {worker_id} completed")

def get_worker_id_with_locks():
    """Get a unique worker ID using MongoDB distributed locks."""
    total_workers = int(os.environ.get('TOTAL_WORKERS', '8'))
    
    # Create a locks collection if it doesn't exist
    locks_collection = db["worker_locks"]
    
    # Create a unique index on worker_id to enforce uniqueness and TTL index
    try:
        locks_collection.create_index("worker_id", unique=True)
        locks_collection.create_index("created_at", expireAfterSeconds=3600)
    except Exception as e:
        logger.info(f"Index may already exist: {e}")
    
    # First, try to find an already assigned ID for this instance
    instance_id = os.environ.get('INSTANCE_ID', socket.gethostname())
    try:
        existing_lock = locks_collection.find_one({"instance_id": instance_id})
        
        if existing_lock:
            logger.info(f"Reusing existing worker ID {existing_lock['worker_id']} for instance {instance_id}")
            
            # Start a background thread to keep updating the heartbeat
            def update_heartbeat():
                while True:
                    try:
                        locks_collection.update_one(
                            {"worker_id": existing_lock['worker_id'], "instance_id": instance_id},
                            {"$set": {"last_heartbeat": datetime.datetime.now(datetime.timezone.utc)}}
                        )
                        time.sleep(60)  # Update once per minute
                    except Exception as e:
                        logger.error(f"Failed to update heartbeat: {e}")
                        time.sleep(5)  # Retry sooner if failed
            
            # Start heartbeat thread as daemon so it doesn't block program exit
            import threading
            heartbeat_thread = threading.Thread(target=update_heartbeat, daemon=True)
            heartbeat_thread.start()
            
            return existing_lock['worker_id']
    except Exception as e:
        logger.error(f"Error checking for existing lock: {e}")
    
    # Get all existing worker IDs to avoid trying to claim them
    try:
        existing_ids = set()
        cursor = locks_collection.find({}, {"worker_id": 1})
        for doc in cursor:
            existing_ids.add(doc["worker_id"])
        logger.info(f"Found existing worker IDs: {sorted(list(existing_ids))}")
    except Exception as e:
        logger.error(f"Error getting existing worker IDs: {e}")
        existing_ids = set()
    
    # Try to acquire a lock for each worker ID sequentially until success
    for worker_id in range(total_workers):
        # Skip IDs that are already taken
        if worker_id in existing_ids:
            logger.info(f"Worker ID {worker_id} already taken, skipping")
            continue
            
        try:
            # Try to insert a document with this worker_id
            result = locks_collection.insert_one({
                "worker_id": worker_id,
                "instance_id": instance_id,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "last_heartbeat": datetime.datetime.now(datetime.timezone.utc)
            })
            
            if result.acknowledged:
                logger.info(f"Successfully acquired lock for worker ID {worker_id}")
                
                # Start a background thread to keep updating the heartbeat
                def update_heartbeat():
                    while True:
                        try:
                            locks_collection.update_one(
                                {"worker_id": worker_id, "instance_id": instance_id},
                                {"$set": {"last_heartbeat": datetime.datetime.now(datetime.timezone.utc)}}
                            )
                            time.sleep(60)  # Update once per minute
                        except Exception as e:
                            logger.error(f"Failed to update heartbeat: {e}")
                            time.sleep(5)  # Retry sooner if failed
                
                # Start heartbeat thread as daemon so it doesn't block program exit
                import threading
                heartbeat_thread = threading.Thread(target=update_heartbeat, daemon=True)
                heartbeat_thread.start()
                
                return worker_id
                
        except Exception as e:
            logger.info(f"Failed to acquire worker ID {worker_id}: {e}")
            # Add a small random delay before trying the next ID
            time.sleep(random.uniform(0.1, 0.5))
            continue
    
    # If we exhausted all worker IDs, we need to check for stale locks
    # A lock is considered stale if its heartbeat hasn't been updated recently
    stale_cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=5)
    
    try:
        stale_lock = locks_collection.find_one_and_delete(
            {"last_heartbeat": {"$lt": stale_cutoff}},
            sort=[("last_heartbeat", 1)]  # Get the oldest stale lock
        )
        
        if stale_lock:
            worker_id = stale_lock["worker_id"]
            # Claim this stale worker ID
            locks_collection.insert_one({
                "worker_id": worker_id,
                "instance_id": instance_id,
                "created_at": datetime.datetime.now(datetime.timezone.utc),
                "last_heartbeat": datetime.datetime.now(datetime.timezone.utc)
            })
            logger.info(f"Claimed stale worker ID {worker_id} from inactive worker")
            
            # Start a background thread to keep updating the heartbeat
            def update_heartbeat():
                while True:
                    try:
                        locks_collection.update_one(
                            {"worker_id": worker_id, "instance_id": instance_id},
                            {"$set": {"last_heartbeat": datetime.datetime.now(datetime.timezone.utc)}}
                        )
                        time.sleep(60)  # Update once per minute
                    except Exception as e:
                        logger.error(f"Failed to update heartbeat: {e}")
                        time.sleep(5)  # Retry sooner if failed
            
            # Start heartbeat thread as daemon so it doesn't block program exit
            import threading
            heartbeat_thread = threading.Thread(target=update_heartbeat, daemon=True)
            heartbeat_thread.start()
            
            return worker_id
    except Exception as e:
        logger.error(f"Error handling stale locks: {e}")
    
    # If all else fails, generate a high worker ID (beyond normal range)
    # This is not ideal but allows the system to continue functioning
    fallback_id = total_workers + random.randint(0, 100)
    logger.warning(f"All worker IDs are taken! Using fallback ID {fallback_id}")
    
    try:
        # Still register this fallback ID
        locks_collection.insert_one({
            "worker_id": fallback_id,
            "instance_id": instance_id,
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "last_heartbeat": datetime.datetime.now(datetime.timezone.utc),
            "is_fallback": True
        })
        
        # Start a background thread to keep updating the heartbeat
        def update_heartbeat():
            while True:
                try:
                    locks_collection.update_one(
                        {"worker_id": fallback_id, "instance_id": instance_id},
                        {"$set": {"last_heartbeat": datetime.datetime.now(datetime.timezone.utc)}}
                    )
                    time.sleep(60)  # Update once per minute
                except Exception as e:
                    logger.error(f"Failed to update heartbeat: {e}")
                    time.sleep(5)  # Retry sooner if failed
        
        # Start heartbeat thread as daemon so it doesn't block program exit
        import threading
        heartbeat_thread = threading.Thread(target=update_heartbeat, daemon=True)
        heartbeat_thread.start()
    except Exception as e:
        logger.error(f"Error registering fallback ID: {e}")
    
    return fallback_id

def update_index_fields():
    """Update all existing items to include fields needed for indexes."""
    current_time = int(time.time())
    
    # First, get all items
    all_items = []
    logger.info("Starting index field update process - fetching existing items")
    
    try:
        cursor = collection.find({}, {"id": 1})
        item_ids = [doc["id"] for doc in cursor]
        
        logger.info(f"Found {len(item_ids)} items to check for index fields")
        
        # Process in batches
        batch_size = 100
        total_batches = (len(item_ids) + batch_size - 1) // batch_size
        
        for i in range(0, len(item_ids), batch_size):
            batch_ids = item_ids[i:i+batch_size]
            updates = []
            
            # Check each item
            for item_id in batch_ids:
                item = collection.find_one({"id": item_id})
                if not item:
                    continue
                
                # Determine status fields
                update_fields = {}
                
                # Ensure content_type field exists
                if 'content_type' not in item:
                    # Try to determine content type from other fields
                    if 'number_of_seasons' in item or 'episode_run_time' in item:
                        update_fields["content_type"] = "tv"
                    elif 'runtime' in item or 'release_year' in item:
                        update_fields["content_type"] = "movie"
                    else:
                        # Default to tv if can't determine
                        update_fields["content_type"] = "tv"
                
                if 'enrichment_status' not in item:
                    if 'genres' in item:
                        update_fields["enrichment_status"] = "UPDATED"
                    else:
                        update_fields["enrichment_status"] = "NEEDS_UPDATE"
                
                if 'provider_status' not in item:
                    if 'provider_data' in item:
                        update_fields["provider_status"] = "UPDATED"
                    else:
                        update_fields["provider_status"] = "NEEDS_UPDATE"
                
                # Add timestamps if needed
                if "enrichment_status" in update_fields and update_fields["enrichment_status"] == "UPDATED" and 'enrichment_updated_at' not in item:
                    update_fields["enrichment_updated_at"] = current_time
                
                if "provider_status" in update_fields and update_fields["provider_status"] == "UPDATED" and 'provider_updated_at' not in item:
                    update_fields["provider_updated_at"] = current_time
                
                # Add to updates if there are fields to update
                if update_fields:
                    updates.append(UpdateOne(
                        {"id": item_id},
                        {"$set": update_fields}
                    ))
            
            # Perform the batch update
            if updates:
                result = collection.bulk_write(updates)
                current_batch = i // batch_size + 1
                logger.info(f"Updated batch {current_batch}/{total_batches} ({current_batch/total_batches*100:.1f}%) - Modified {result.modified_count} items")
            
    except Exception as e:
        logger.error(f"Error updating index fields: {e}")

def run_discovery(worker_id):
    """
    Run the discovery process to find and store new content.
    
    Args:
        worker_id (int): The worker ID assigned to this process
    """
    total_workers = int(os.environ.get('TOTAL_WORKERS', '8'))
    
    logger.info(f"Starting discovery process with worker_id {worker_id} for content_type={CONTENT_TYPE}")
    
    # Process TV shows (distribute by page number)
    if CONTENT_TYPE in ['tv', 'both']:
        logger.info(f"Starting TV discovery for worker {worker_id}")
        
        # For TV shows, distribute by page numbers
        # Each worker takes every nth page where n = total_workers
        worker_pages = [p for p in range(START_PAGE, END_PAGE + 1) 
                       if (p - START_PAGE) % total_workers == worker_id]
        
        logger.info(f"Worker {worker_id}/{total_workers} will process {len(worker_pages)} TV pages: {worker_pages[:10]}...")
        
        # Use a reasonable number of threads based on the actual workload
        actual_workers = min(MAX_WORKERS, len(worker_pages))
        
        with ThreadPoolExecutor(max_workers=actual_workers) as executor:
            executor.map(discover_and_store_tv, [[page] for page in worker_pages])
    
    # Process movies (distribute primarily by release year)
    if CONTENT_TYPE in ['movies', 'both']:
        logger.info(f"Starting movie discovery for worker {worker_id}")
        
        # For movies, distribute work primarily by years
        total_years = MOVIE_END_YEAR - MOVIE_START_YEAR + 1
        
        # Each worker handles specific years
        worker_years = [year for i, year in enumerate(range(MOVIE_START_YEAR, MOVIE_END_YEAR + 1)) 
                       if i % total_workers == worker_id]
        
        logger.info(f"Worker {worker_id} will process movies for years: {worker_years}")
        
        # Define fixed page range for each year
        # We use all pages for each year since the primary distribution is by year
        movie_pages = list(range(START_PAGE, END_PAGE + 1))
        
        # Process movies for each year assigned to this worker
        for year in worker_years:
            logger.info(f"Processing movies for year {year}")
            with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                # Break pages into chunks for processing
                page_chunks = list(chunk_list(movie_pages, 10))  # Process 10 pages at a time
                for chunk in page_chunks:
                    executor.submit(discover_and_store_movies, chunk, year)

def main():
    """Main entry point for the script."""
    # Check for index update operation
    if PROCESS_TYPE == 'update_indexes':
        logger.info("Running index field update process")
        update_index_fields()
        return
    
    # Get worker ID and total workers for parallel processing
    worker_id = get_worker_id_with_locks()
    total_workers = int(os.environ.get('TOTAL_WORKERS', '8'))
    
    logger.info(f"Starting data processing with process_type={PROCESS_TYPE}, content_type={CONTENT_TYPE}, worker {worker_id+1}/{total_workers}")
    
    start_time = time.time()
    
    # Allow system to initialize and other workers to start
    time.sleep(15)
    
    if PROCESS_TYPE == 'discover' or PROCESS_TYPE == 'full':
        # Discovery process for new content
        run_discovery(worker_id)
        time.sleep(15)
    
    if PROCESS_TYPE == 'enrich' or PROCESS_TYPE == 'full':
        # Determine which content types to enrich
        if CONTENT_TYPE == 'both':
            content_types = ['tv', 'movie']
        else:
            content_types = [CONTENT_TYPE]
        
        for content_type in content_types:
            # Fetch items needing enrichment
            items_list = fetch_items_needing_enrichment_refresh(content_type)
            
            if items_list:
                # Distribute workload across workers by taking every nth item
                worker_items = [item for i, item in enumerate(items_list) if i % total_workers == worker_id]
                logger.info(f"Worker {worker_id} will process {len(worker_items)} {content_type} items out of {len(items_list)} total")
                
                # Process this worker's portion
                chunks = list(chunk_list(worker_items, BATCH_SIZE))
                with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                    for chunk in chunks:
                        executor.submit(process_worker, worker_id, 'enrich', [chunk], content_type)
        
        time.sleep(15)
    
    if PROCESS_TYPE == 'providers' or PROCESS_TYPE == 'full':
        # Determine which content types to process for providers
        if CONTENT_TYPE == 'both':
            content_types = ['tv', 'movie']
        else:
            content_types = [CONTENT_TYPE]
        
        for content_type in content_types:
            # Fetch items needing provider data
            items_list = fetch_items_needing_provider_refresh(content_type)
            
            if items_list:
                # Distribute workload across workers
                worker_items = [item for i, item in enumerate(items_list) if i % total_workers == worker_id]
                logger.info(f"Worker {worker_id} will process {len(worker_items)} {content_type} items out of {len(items_list)} total")
                
                # Process this worker's portion
                chunks = list(chunk_list(worker_items, BATCH_SIZE))
                with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
                    for chunk in chunks:
                        executor.submit(process_worker, worker_id, 'providers', [chunk], content_type)
    
    elapsed_time = time.time() - start_time
    logger.info(f"Worker {worker_id} processing completed in {elapsed_time:.2f} seconds")

if __name__ == "__main__":
    main()