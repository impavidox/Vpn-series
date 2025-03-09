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
    'https://d32y6wudour403.cloudfront.net',
    '*'  # Allow all origins (be careful with this in production)
]

# MongoDB connection details
MONGO_URI = 'mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
DB_NAME = 'vpn-series-db'
COLLECTION_NAME = 'series_collectiontmdb'

# Constants
DEFAULT_PAGE_SIZE = 56

class JSONSerializer:
    """Helper class for JSON serialization"""
    
    @staticmethod
    def serialize(data):
        """Serialize data with custom handling for non-standard types"""
        try:
            return json.dumps(data, default=JSONSerializer._custom_serializer)
        except Exception as e:
            logger.error(f"Serialization error: {e}")
            return json.dumps(str(data))
    
    @staticmethod
    def _custom_serializer(obj):
        """Custom JSON serialization for non-standard types"""
        if isinstance(obj, datetime):
            return obj.isoformat()
        elif hasattr(obj, '__dict__'):
            return obj.__dict__
        # Handle ObjectId-like objects with __str__ method
        elif hasattr(obj, '__str__'):
            return str(obj)
        raise TypeError(f"Object of type {type(obj)} is not JSON serializable")

class CORSHandler:
    """Helper class for CORS handling"""
    
    @staticmethod
    def get_headers(origin=None):
        """Generate appropriate CORS headers based on the origin"""
        headers = {
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token,content-type,Accept',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,DELETE,PUT',
            'Vary': 'Origin, Access-Control-Request-Headers',
            'Content-Type': 'application/json'
        }
        
        # For local development or when wildcard is more appropriate
        if '*' in CORS_ORIGINS:
            headers['Access-Control-Allow-Origin'] = '*'
            return headers
            
        # Set the appropriate Access-Control-Allow-Origin header
        if origin and origin in CORS_ORIGINS:
            headers['Access-Control-Allow-Origin'] = origin
        else:
            # Default response for preflight requests
            headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        
        return headers

class MongoDBClient:
    """MongoDB connection and query handling"""
    
    @staticmethod
    def get_collection():
        """Establish MongoDB connection and return the collection"""
        try:
            client = MongoClient(MONGO_URI)
            db = client[DB_NAME]
            collection = db[COLLECTION_NAME]
            return collection
        except Exception as e:
            logger.error(f"MongoDB connection error: {e}", exc_info=True)
            raise
            
    @staticmethod
    def get_item_by_id(collection, item_id):
        """Retrieve a single item by its id field"""
        try:
            # Explicitly use the id field index for lookup
            # Adding .hint() to force use of the index when available
            try:
                # First try with hint to use the index
                item = collection.find_one({"id": item_id}).hint([('id', ASCENDING)])
            except Exception as hint_error:
                # If hint fails (e.g., index doesn't exist), fall back to regular query
                logger.warning(f"Hint failed, using regular query: {hint_error}")
                item = collection.find_one({"id": item_id})
            
            # Return None if item not found
            if not item:
                logger.info(f"No item found with id: {item_id}")
                return None
            
            # If _id exists in the result, convert it to string for JSON serialization
            if "_id" in item:
                item["_id"] = str(item["_id"])
                
            return item
        except Exception as e:
            logger.error(f"Error retrieving item by ID {item_id}: {e}", exc_info=True)
            raise
    
    @staticmethod
    def create_indexes(collection):
        """Create indexes to improve query performance"""
        try:
            indexes = [
                # Text index for title searching
                [('title', TEXT)],
                
                # Compound index for year and genres
                [('year', ASCENDING), ('genres', ASCENDING)],
                
                # Index for provider data
                [('provider_data', ASCENDING)],
                
                # Compound index for sorting and filtering
                [('vote_count', ASCENDING), ('year', ASCENDING)]
            ]
            
            for index in indexes:
                try:
                    collection.create_index(index)
                    logger.info(f"Created index: {index}")
                except Exception as index_error:
                    logger.warning(f"Failed to create index {index}: {index_error}")
        
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    @staticmethod
    def build_provider_query(country, providers):
        """Build query for provider filtering"""
        try:
            # If no country or providers, return empty query
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

class RequestHandler:
    """Parse and process API requests"""
    
    def __init__(self, event):
        self.event = event
        self.collection = MongoDBClient.get_collection()
        self.normalized_headers = self._normalize_headers()
        self.origin = self._extract_origin()
        self.cors_headers = CORSHandler.get_headers(self.origin)
        self.method = event.get('requestContext','').get('http','').get('method', '').upper()
        self.resource_path = event.get('rawPath', '')
        self.path_parameters = event.get('pathParameters', {}) or {}
        
        # Log request details
        logger.info(f"HTTP Method: {self.method}")
        logger.info(f"Resource Path: {self.resource_path}")
        logger.info(f"Path Parameters: {self.path_parameters}")
        logger.info(f"Headers: {self.normalized_headers}")
    
    def _normalize_headers(self):
        """Extract and normalize headers"""
        headers = self.event.get('headers', {}) or self.event.get('httpHeaders', {}) or {}
        return {k.lower(): v for k, v in headers.items()}
    
    def _extract_origin(self):
        """Extract origin from headers"""
        return self.normalized_headers.get('origin') or self.normalized_headers.get('host')
    
    def handle_preflight(self):
        """Handle CORS preflight requests"""
        if self.method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': self.cors_headers,
                'body': ''
            }
        return None
    
    def extract_parameters(self):
        """Extract and merge query parameters and body parameters"""
        # Get query parameters
        query_params = self.event.get('queryStringParameters', {}) or {}
        
        # Get body parameters for POST requests
        body_params = {}
        try:
            body = self.event.get('body', '{}') or '{}'
            if body:
                body_params = json.loads(body)
        except json.JSONDecodeError:
            logger.warning("Failed to parse request body as JSON")
        
        # Combine parameters, with body parameters taking precedence
        combined_params = {**query_params, **body_params}
        
        return combined_params
    
    def build_mongo_query(self, params):
        """Build MongoDB query from request parameters"""
        query = {}
        
        # Title filtering (case-insensitive)
        if title := params.get('title'):
            query['title'] = {
                '$regex': re.escape(title), 
                '$options': 'i'
            }
        
        # Year filtering
        if year := params.get('year'):
            query['year'] = str(year)
        
        # Genres filtering
        if genres := params.get('genres'):
            query['genres'] = {'$all': genres}
        
        # Build provider query
        try:
            provider_query = MongoDBClient.build_provider_query(
                params.get('country', ''),
                params.get('streaming', [])
            )
            # Combine with other query parameters
            query = {**query, **provider_query}
        except Exception as e:
            logger.error(f"Error building provider query: {e}")
        
        return query
    
    def execute_query(self, query, page=1):
        """Execute query with pagination"""
        try:
            # Calculate pagination
            limit = DEFAULT_PAGE_SIZE
            skip = (page - 1) * limit
            
            # Define projection (fields to return)
            projection = {
                "title": 1,
                "vote_average": 1,
                "year": 1,
                "poster_path": 1,
                "id": 1,
                "_id": 0,  # Exclude the _id field
            }
            
            # Execute query
            results = list(
                self.collection.find(query, projection)
                .sort("vote_count", -1)
                .skip(skip)
                .limit(limit)
            )
            
            return results
        except Exception as e:
            logger.error(f"Error executing MongoDB query: {e}", exc_info=True)
            raise

def lambda_handler(event, context):
    """Main Lambda function handler"""
    try:
        # Log full event for debugging
        logger.info(f"Full event: {json.dumps(event)}")
        
        # Initialize request handler
        handler = RequestHandler(event)
        
        # Handle CORS preflight
        preflight_response = handler.handle_preflight()
        if preflight_response:
            return preflight_response

        logger.info(f"Works {handler.resource_path}")
        # Check if this is a request for a single item by ID
        if '/api/series/' in handler.resource_path and handler.method=='GET':
            # Extract the ID from path parameters
            item_id = handler.path_parameters.get('id')
            logger.info(f"Works ")
            if not item_id:
                return {
                    'statusCode': 400,
                    'headers': handler.cors_headers,
                    'body': json.dumps({'error': 'Missing item ID'})
                }
            
            # First try to find the item by field 'id'
            item = MongoDBClient.get_item_by_id(handler.collection, item_id)
            
            # If item is not found using 'id' field, try using title field
            if not item:
                # Try to find by title (assuming titles are unique)
                item = handler.collection.find_one({"title": item_id})
                
                # If title doesn't match, try with case insensitive search 
                if not item:
                    item = handler.collection.find_one({"title": {"$regex": f"^{re.escape(item_id)}$", "$options": "i"}})
            
            if not item:
                return {
                    'statusCode': 404,
                    'headers': handler.cors_headers,
                    'body': json.dumps({'error': 'Item not found'})
                }
                
            # If _id exists in the result, convert it to string for JSON serialization 
            if "_id" in item:
                item["_id"] = str(item["_id"])
            
            # Return the item
            return {
                'statusCode': 200,
                'headers': handler.cors_headers,
                'body': JSONSerializer.serialize(item)
            }
        else:
            # Handle regular search queries
            # Extract parameters
            params = handler.extract_parameters()
            
            # Build MongoDB query
            query = handler.build_mongo_query(params)
            
            # Get pagination parameters
            page = int(params.get('page', 1))
            
            # Execute query
            results = handler.execute_query(query, page)
            
            # Return successful response
            return {
                'statusCode': 200,
                'headers': handler.cors_headers,
                'body': JSONSerializer.serialize(results)
            }
    
    except Exception as e:
        # Log the error
        logger.error(f"Unhandled error in lambda_handler: {e}", exc_info=True)
        
        # Prepare CORS headers for error response
        cors_headers = CORSHandler.get_headers()
        
        # Extract method and resource information for error details
        method = event.get('httpMethod', '')
        resource = event.get('resource', '')
        
        # Return error response
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Internal Server Error', 
                'details': str(e),
                'method': method,
                'resource': resource
            })
        }

# Create indexes on cold start
try:
    collection = MongoDBClient.get_collection()
    MongoDBClient.create_indexes(collection)
except Exception as e:
    logger.error(f"Failed to create indexes on cold start: {e}", exc_info=True)