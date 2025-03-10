import json
import re
import logging
import os
from pymongo import MongoClient, ASCENDING, TEXT
from datetime import datetime
from bson import ObjectId

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# CORS Configuration
CORS_ORIGINS = [
    'http://vpn-series-frontend.s3-website.eu-central-1.amazonaws.com',
    'http://localhost:3000',
    'https://d32y6wudour403.cloudfront.net'
]

def custom_json_serializer(obj):
    """
    Custom JSON serialization to handle non-serializable types
    """
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif hasattr(obj, '__dict__'):
        return obj.__dict__
    # Manually handle ObjectId-like objects with __str__ method
    elif hasattr(obj, '__str__'):
        return str(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

def json_serialize(data):
    """
    Serialize data with custom handling
    """
    try:
        return json.dumps(data, default=custom_json_serializer)
    except Exception as e:
        logger.error(f"Serialization error: {e}")
        return json.dumps(str(data))

def get_cors_headers(origin=None):
    """
    Generate CORS headers based on the origin
    """
    headers = {
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,content-type,Accept',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Vary': 'Origin, Access-Control-Request-Headers'
    }
    
    # Check if origin is allowed
    if origin and origin in CORS_ORIGINS:
        headers['Access-Control-Allow-Origin'] = origin
    else:
        # Default to first allowed origin if no match
        headers['Access-Control-Allow-Origin'] = CORS_ORIGINS[0]
    
    return headers

def get_mongo_client():
    """
    Establish MongoDB connection with comprehensive error handling
    """
    try:
        # Hardcoded connection string
        mongo_uri = 'mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
        
        # Establish MongoDB client
        client = MongoClient(mongo_uri)
        
        # Select database and collection
        db = client['vpn-series-db']
        collection = db['series_collectiontmdb']
        
        return collection
    
    except Exception as e:
        logger.error(f"MongoDB connection error: {e}", exc_info=True)
        raise

def create_mongodb_indexes(collection):
    """
    Create indexes to improve query performance
    """
    try:
        indexes = [
            # Text index for title searching
            [('title', TEXT)],
            
            # Compound index for year and genres
            [('year', ASCENDING), ('genres', ASCENDING)],
            
            # Index for provider data to speed up complex queries
            [('provider_data', ASCENDING)],
            
            # Compound index for sorting and filtering
            [('vote_count', ASCENDING), ('year', ASCENDING)]
        ]
        
        # Create indexes with error handling
        for index in indexes:
            try:
                collection.create_index(index)
                logger.info(f"Created index: {index}")
            except Exception as index_error:
                logger.warning(f"Failed to create index {index}: {index_error}")
    
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")

def build_mongo_query(country, providers):
    """
    Build complex MongoDB query for provider filtering
    """
    try:
        # Validate inputs
        if not country or not providers:
            return {}

        # Build exists check for each provider in the given country
        and_clauses = [{f"provider_data.{country}.{provider}": {"$exists": False}} for provider in providers]

        query = {
            "$and": and_clauses + [
                {
                    "$expr": {
                        "$gt": [
                            {
                                "$size": {
                                    "$ifNull": [
                                        {
                                            "$filter": {
                                                "input": {
                                                    "$reduce": {
                                                        "input": {
                                                            "$objectToArray": "$provider_data"
                                                        },
                                                        "initialValue": [],
                                                        "in": {
                                                            "$concatArrays": [
                                                                "$$value",
                                                                {
                                                                    "$objectToArray": "$$this.v"
                                                                }
                                                            ]
                                                        }
                                                    }
                                                },
                                                "as": "provider",
                                                "cond": {
                                                    "$or": [
                                                        {"$eq": ["$$provider.k", provider]} 
                                                        for provider in providers
                                                    ]
                                                }
                                            }
                                        },
                                        []
                                    ]
                                }
                            },
                            0
                        ]
                    }
                }
            ]
        }
        
        return query
    
    except Exception as e:
        logger.error(f"Error building provider query: {e}")
        return {}

def get_projection(projection_type="minimal"):
    """
    Get MongoDB projection based on requested projection type
    
    Args:
        projection_type (str): Type of projection, "minimal" or "full"
        
    Returns:
        dict: MongoDB projection document
    """
    if projection_type == "minimal":
        # Minimal projection for grid display (faster loading)
        return {
            "title": 1,
            "vote_average": 1,
            "year": 1,
            "poster_path": 1,
            "_id": 1
        }
    elif projection_type == "details":
        # Detailed projection for single item view without provider data
        return {
            "title": 1,
            "vote_average": 1,
            "vote_count": 1,
            "year": 1,
            "poster_path": 1,
            "backdrop_path": 1,
            "genres": 1,
            "plot": 1,
            "actors": 1,
            "episode_run_time": 1,
            "number_of_seasons": 1,
            "_id": 1
        }
    else:
        # Full projection
        return None  # None means no projection, return all fields


def extract_and_sort_providers_and_countries(provider_data,providers_to_keep,max_countries,country_to_exclude):
    # Convert providers_to_keep to a set for O(1) lookups if it exists
    providers_set = set(providers_to_keep) if providers_to_keep else None
    
    # Pre-allocate dictionaries
    extracted_data = {}
    country_max_counts = {}
    
    # Process each country
    for country_code, providers in provider_data.items():

        if country_code==country_to_exclude:
            continue


        filtered_providers = {}
        max_count = -1

        
        # Filter providers - simplified logic
        if providers_to_keep is None:
            # Keep all providers if no filter
            filtered_providers = providers
            # Find max count for country sorting
            for provider_info in providers.values():
                count = provider_info.get("count", -1)
                if count > max_count:
                    max_count = count
        else:
            # Apply filter
            for provider_name, provider_info in providers.items():
                if provider_name in providers_set:
                    filtered_providers[provider_name] = provider_info
                    count = provider_info.get("count", -1)
                    if count > max_count:
                        max_count = count
        
        # Only add country if it has providers after filtering
        if filtered_providers:
            # Sort providers by count (convert to list, sort, convert back to dict)
            sorted_providers = sorted(
                filtered_providers.items(),
                key=lambda item: item[1].get("count", -1),
                reverse=True
            )
            extracted_data[country_code] = dict(sorted_providers)
            country_max_counts[country_code] = max_count
    
    # Sort countries by max count and build final result
    sorted_countries = sorted(
        country_max_counts.items(),
        key=lambda item: item[1],
        reverse=True
    )
    
    # Limit to max_countries if specified
    if max_countries is not None:
        sorted_countries = sorted_countries[:max_countries]
    
    # Build final sorted dictionary using dictionary comprehension
    return {
        country_code: extracted_data[country_code]
        for country_code, _ in sorted_countries
    }


def lambda_handler(event, context):
    """
    Lambda function handler with enhanced CORS and error handling
    """
    try:
        # Log full event for comprehensive debugging
        logger.info(f"Full event: {json.dumps(event)}")
        
        # Extract headers with case-insensitive lookup
        headers = event.get('headers', {}) or event.get('httpHeaders', {})
        if not headers:
            headers = {}
        
        # Normalize header keys to lowercase
        headers = {k.lower(): v for k, v in headers.items()}
        
        # Extract origin for CORS
        origin = headers.get('origin') or headers.get('host')
        
        # Prepare CORS headers
        cors_headers = get_cors_headers(origin)
        
        # Extract method and resource information
        http_method = event.get('requestContext','').get('http','').get('method', '').upper()
        resource_path = event.get('rawPath', '')
        path = event.get('path', '')
        
        # Log method and resource details
        logger.info(f"HTTP Method: {http_method}")
        logger.info(f"Resource Path: {resource_path}")
        logger.info(f"Path: {path}")
        logger.info(f"Headers: {headers}")
        
        # Get the MongoDB collection
        collection = get_mongo_client()
        
        # CORS Preflight Handling
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': ''
            }

        # Handle new '/shows/batch' endpoint
        if resource_path == '/api/shows/batch' and http_method == 'POST':
            # Parse body for POST request
            try:
                body = event.get('body', '{}') or '{}'
                batch_criteria = json.loads(body)
                
                # Get IDs from the request
                show_ids = batch_criteria.get('ids', [])
                show_ids=  [ObjectId(s) for s in show_ids]
                projection_type = batch_criteria.get('projection', 'full')
                
                if not show_ids:
                    return {
                        'statusCode': 400,
                        'headers': {
                            **cors_headers,
                            'Content-Type': 'application/json'
                        },
                        'body': json.dumps({'error': 'No show IDs provided'})
                    }
                
                # Get the appropriate projection
                projection = get_projection(projection_type)
                
                # Query for multiple shows by ID
                query = {"_id": {"$in": show_ids}}
                
                # Fetch the detailed data
                results = list(collection.find(query, projection))
                
                # For full projection, include provider data
                if projection_type == 'full':
                    # Handle any provider filtering logic if needed
                    country = batch_criteria.get('country', '')
                    streaming = batch_criteria.get('streaming', [])
                    for result in results:
                        result['provider_data']=extract_and_sort_providers_and_countries(result['provider_data'],streaming,8,country)
                    # You could apply additional provider filtering here
                    # This would depend on your specific requirements
                
                # Return the batch results
                return {
                    'statusCode': 200,
                    'headers': {
                        **cors_headers,
                        'Content-Type': 'application/json'
                    },
                    'body': json_serialize(results)
                }
            
            except Exception as e:
                logger.error(f"Error processing batch request: {e}", exc_info=True)
                return {
                    'statusCode': 500,
                    'headers': {
                        **cors_headers,
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({
                        'error': 'Internal Server Error', 
                        'details': str(e)
                    })
                }

        # Handle individual show details endpoint
        if resource_path.startswith('/api/shows/') and resource_path != '/api/shows/batch' and http_method == 'GET':
            # Extract show ID from path
            show_id = path.split('/')[-1]
            
            # Get query parameters
            query_params = event.get('queryStringParameters', {}) or {}
            country = query_params.get('country', '')
            streaming_param = query_params.get('streaming', '')
            streaming = streaming_param.split(',') if streaming_param else []
            
            # Fetch the show details
            show_details = collection.find_one({"_id": show_id})
            
            if not show_details:
                return {
                    'statusCode': 404,
                    'headers': {
                        **cors_headers,
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'error': 'Show not found'})
                }
            
            # Return the show details
            return {
                'statusCode': 200,
                'headers': {
                    **cors_headers,
                    'Content-Type': 'application/json'
                },
                'body': json_serialize(show_details)
            }
        
        # Handle main filter endpoint
        if resource_path == '/api/filter' and (http_method == 'POST' or http_method == 'GET'):
            # Flexible input parsing
            query_params = event.get('queryStringParameters', {}) or {}
            body_params = {}
            
            # Parse body for POST and other methods
            try:
                body = event.get('body', '{}') or '{}'
                body_params = json.loads(body)
            except json.JSONDecodeError:
                # If body parsing fails, use query parameters
                body_params = query_params
            
            # Unified query building for both GET and POST
            query = {}
            
            # Title filtering (case-insensitive)
            title = body_params.get('title') or query_params.get('title')
            if title:
                query['title'] = {
                    '$regex': re.escape(title), 
                    '$options': 'i'
                }
            
            # Year filtering
            year = body_params.get('year') or query_params.get('year')
            if year:
                query['year'] = str(year)
            
            # Genres filtering
            genres = body_params.get('genres') or query_params.get('genres')
            if genres:
                query['genres'] = {'$all': genres}
            
            # Pagination
            page = int(body_params.get('page', query_params.get('page', 1)))
            limit = 56
            skip = (page - 1) * limit
            
            # Get projection type
            projection_type = body_params.get('projection') or query_params.get('projection') or 'minimal'
            projection = get_projection(projection_type)
            
            # Build provider query
            try:
                query_user = build_mongo_query(
                    body_params.get('country', query_params.get('country', '')), 
                    body_params.get('streaming', query_params.get('streaming', []))
                )
            except Exception as query_error:
                logger.error(f"Error building provider query: {query_error}")
                query_user = {}
            
            # Combine queries
            combined_query = {**query_user, **query}
            
            # Retrieve filtered data with projection
            filtered_data = list(
                collection.find(
                    combined_query,
                    projection
                )
                .sort("vote_count", -1)
                .skip(skip)
                .limit(limit)
            )
            
            # Return response with CORS headers
            return {
                'statusCode': 200,
                'headers': {
                    **cors_headers,
                    'Content-Type': 'application/json'
                },
                'body': json_serialize(filtered_data)
            }
        
        # Return 404 for unmatched routes
        return {
            'statusCode': 404,
            'headers': {
                **cors_headers,
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Not Found',
                'path': path
            })
        }
    
    except Exception as e:
        # Enhanced error logging
        logger.error(f"Unhandled error in lambda_handler: {e}", exc_info=True)
        
        # Return error response with CORS headers
        return {
            'statusCode': 500,
            'headers': {
                **cors_headers,
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal Server Error', 
                'details': str(e),
                'method': http_method,
                'resource': resource_path
            })
        }

# Diagnostic index creation on cold start
try:
    collection = get_mongo_client()
    create_mongodb_indexes(collection)
except Exception as e:
    logger.error(f"Failed to create indexes on cold start: {e}", exc_info=True)