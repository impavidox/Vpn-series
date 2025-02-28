import json
from pymongo import MongoClient
from bson.json_util import dumps, loads
import re

# MongoDB setup - this will be initialized outside the handler for connection reuse
client = MongoClient('mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['vpn-series-db']
collection = db['series_collectiontmdb']

def build_mongo_query(country, providers):
    # Building the $and clause dynamically based on the providers
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

def lambda_handler(event, context):
    """
    AWS Lambda handler function
    """
    # Get HTTP method and path from the event
    http_method = event.get('httpMethod')
    path = event.get('path', '')
    
    # For API Gateway v2 (HTTP API), the structure is different
    if http_method is None and 'requestContext' in event and 'http' in event['requestContext']:
        http_method = event['requestContext']['http']['method']
        path = event['requestContext']['http']['path']
    
    # Route the request based on the HTTP method and path
    if http_method == 'GET' and path.endswith('/api/data'):
        return handle_get_data(event)
    elif http_method == 'POST' and path.endswith('/api/filter'):
        return handle_filter_data(event)
    elif http_method == 'OPTIONS':
        return handle_options()
    else:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps({'error': 'Not found'})
        }

def handle_get_data(event):
    """
    Handle GET /api/data
    """
    # Extract query parameters from the event
    query_params = {}
    if 'queryStringParameters' in event and event['queryStringParameters']:
        query_params = event['queryStringParameters']
    
    # Query MongoDB
    data = collection.find(query_params).limit(56)
    
    # Convert MongoDB response to JSON and return
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': dumps(data)
    }

def handle_filter_data(event):
    """
    Handle POST /api/filter
    """
    # Parse the request body
    try:
        # Check if the body is already parsed (JSON)
        if isinstance(event.get('body'), dict):
            filter_criteria = event['body']
        else:
            filter_criteria = json.loads(event.get('body', '{}'))
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps({'error': 'Invalid JSON'})
        }
    
    # Build MongoDB query
    query = {}
    if filter_criteria:
        # Handle title filtering with partial match (case-insensitive)
        if 'title' in filter_criteria:
            query['title'] = {'$regex': re.escape(filter_criteria['title']), '$options': 'i'}

        # Handle year filtering
        if 'year' in filter_criteria:
            query['year'] = str(filter_criteria['year'])

        if 'genres' in filter_criteria:
            query['genres'] = {'$all': filter_criteria['genres']}
    
    # Pagination
    page = int(filter_criteria.get('page', 1))
    limit = 56  # Number of results per page
    skip = (page - 1) * limit  # Calculate the number of documents to skip
    
    # Build query for streaming providers
    if 'country' in filter_criteria and 'streaming' in filter_criteria:
        query_user = build_mongo_query(filter_criteria['country'], filter_criteria['streaming'])
        combined_query = {**query_user, **query}
    else:
        combined_query = query
    
    # Execute query
    filtered_data = list(collection.find(combined_query).sort('vote_count', -1).skip(skip).limit(limit))
    
    # Return response
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': dumps(filtered_data)
    }

def handle_options():
    """
    Handle OPTIONS requests for CORS preflight
    """
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': ''
    }