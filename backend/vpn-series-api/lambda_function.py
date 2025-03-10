import json
import re
import logging
import os
from pymongo import MongoClient, ASCENDING, TEXT
from datetime import datetime

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
        http_method = event.get('httpMethod', '').upper()
        resource_path = event.get('resource', '')
        
        # Log method and resource details
        logger.info(f"HTTP Method: {http_method}")
        logger.info(f"Resource Path: {resource_path}")
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
        
        # Retrieve filtered data
        filtered_data = list(
            collection.find(
                combined_query,
                {
                    "title": 1,
                    "vote_average": 1,
                    "year": 1,
                    "poster_path": 1,
                    "_id": 0,  # Exclude the _id field
                },
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