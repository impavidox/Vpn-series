from flask import Flask, request, jsonify
from flask_cors import CORS
import boto3
from boto3.dynamodb.conditions import Key, Attr, And, Or
import json
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# DynamoDB setup
dynamodb = boto3.resource('dynamodb',
    region_name='eu-central-1'
)
table = dynamodb.Table('SeriesTable')  # Replace with your table name

def build_dynamodb_query(country, providers):
    """
    Build a DynamoDB query expression to find items where:
    1. The specified providers don't exist in the specified country
    2. But those providers do exist in at least one other country
    
    Args:
        country (str): Country code (e.g., "US", "GB")
        providers (list): List of provider IDs to filter by
        
    Returns:
        dict: DynamoDB FilterExpression
    """
    # Initialize filter expression components
    filter_expressions = []
    
    # Part 1: Ensure the specified providers don't exist in the specified country
    country_provider_conditions = []
    
    for provider in providers:
        # Check if the provider doesn't exist in the specified country's provider list
        provider_not_in_country = ~Attr(f"provider_data.{country}.L").contains(
            {"M": {"provider_id": {"S": provider}}}
        )
        country_provider_conditions.append(provider_not_in_country)
    
    if country_provider_conditions:
        filter_expressions.append(And(*country_provider_conditions))
    
    # Part 2: Ensure at least one of these providers exists in some other country
    provider_exists_conditions = []
    
    for provider in providers:
        # Create a condition to check for this provider in any country other than the specified one
        provider_exists_in_other_countries = []
        
        # Get all country keys from the provider_data map
        # For this, we might need a separate function that scans the data first to get all country keys
        # For now, we'll assume some common country codes
        common_countries = ["US", "GB", "CA", "FR", "DE", "JP", "AU", "ES", "IT"]
        
        for other_country in common_countries:
            if other_country != country:
                provider_exists_in_other_countries.append(
                    Attr(f"provider_data.{other_country}.L").contains(
                        {"M": {"provider_id": {"S": provider}}}
                    )
                )
        
        if provider_exists_in_other_countries:
            provider_exists_conditions.append(Or(*provider_exists_in_other_countries))
    
    if provider_exists_conditions:
        filter_expressions.append(Or(*provider_exists_conditions))
    
    # Combine all filter expressions with AND
    return And(*filter_expressions) if filter_expressions else None

@app.route('/api/data', methods=['GET'])
def get_data():
    # Get query parameters
    query_params = request.args.to_dict()
    
    # For DynamoDB, we need to convert query parameters to scan expressions
    scan_params = {}
    
    if query_params:
        filter_expressions = []
        
        for key, value in query_params.items():
            filter_expressions.append(Attr(key).eq(value))
        
        if filter_expressions:
            combined_filter = And(*filter_expressions)
            scan_params['FilterExpression'] = combined_filter
    
    # Add limit
    scan_params['Limit'] = 56
    
    # Execute scan
    response = table.scan(**scan_params)
    items = response.get('Items', [])
    
    # Return JSON response
    return jsonify(items)

@app.route('/api/filter', methods=['POST'])
def filter_data():
    filter_criteria = request.json
    
    # Start with an empty filter expression list
    filter_expressions = []
    
    if filter_criteria:
        # Handle title filtering with partial match (case-insensitive)
        if 'title' in filter_criteria:
            # DynamoDB doesn't support regex directly like MongoDB
            # We can use 'contains' or 'begins_with' depending on the requirement
            filter_expressions.append(
                Attr('title').contains(filter_criteria['title'])
            )
        
        # Handle year filtering
        if 'year' in filter_criteria:
            filter_expressions.append(
                Attr('year').eq(str(filter_criteria['year']))
            )
        
        # Handle genres filtering
        if 'genres' in filter_criteria:
            # For each genre, add a condition that it must be in the genres list
            for genre in filter_criteria['genres']:
                # Assuming genres is stored as a list of objects with 'S' attribute
                filter_expressions.append(
                    Attr('genres').contains({"S": genre})
                )
        
        # Handle provider filtering
        if 'country' in filter_criteria and 'streaming' in filter_criteria:
            country = filter_criteria['country']
            providers = filter_criteria['streaming']
            
            provider_filter = build_dynamodb_query(country, providers)
            if provider_filter:
                filter_expressions.append(provider_filter)
    
    # Pagination parameters
    page = int(filter_criteria.get('page', 1))
    limit = 56  # Number of results per page
    
    # Combine all filter expressions with AND
    combined_filter = And(*filter_expressions) if filter_expressions else None
    
    # Prepare scan parameters
    scan_params = {}
    if combined_filter:
        scan_params['FilterExpression'] = combined_filter
    
    # DynamoDB doesn't support skip directly, but we can use LastEvaluatedKey for pagination
    # For the first page, we don't need LastEvaluatedKey
    
    # Add limit
    scan_params['Limit'] = limit
    
    # Execute scan
    response = table.scan(**scan_params)
    items = response.get('Items', [])
    
    # If not first page, we need to skip items
    if page > 1:
        # This is a simple implementation of pagination
        # For a large dataset, you would use LastEvaluatedKey from previous scans
        skip = (page - 1) * limit
        scan_count = limit
        last_evaluated_key = response.get('LastEvaluatedKey')
        
        while len(items) < skip + limit and last_evaluated_key:
            scan_params['ExclusiveStartKey'] = last_evaluated_key
            response = table.scan(**scan_params)
            items.extend(response.get('Items', []))
            last_evaluated_key = response.get('LastEvaluatedKey')
            
            if not last_evaluated_key:
                break
        
        # Get only the items for the requested page
        items = items[skip:skip+limit]
    
    # Return JSON response
    return jsonify(items)

if __name__ == '__main__':
    app.run(debug=True)