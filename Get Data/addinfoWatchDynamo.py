import requests
import time
import boto3
import json
from decimal import Decimal
from multiprocessing import Pool, cpu_count
from botocore.exceptions import ClientError

# Constants and configurations
headers = {
    "accept": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTU5OC4yMTc0OTEsInN1YiI6IjY2Y2U1YTAxYWFjOTVjODg4YTY2ZDViOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.D1IRi_GiU_9BLWXbl2jGApNVYL_bMDGBPONBvs0XZaE"
}

# AWS DynamoDB setup
dynamodb = boto3.resource('dynamodb')
table_name = 'SeriesTable'  # Replace with your DynamoDB table name
table = dynamodb.Table(table_name)

# Helper class to convert float to Decimal for DynamoDB
class DecimalEncoder:
    @staticmethod
    def encode(obj):
        if isinstance(obj, float):
            return Decimal(str(obj))
        elif isinstance(obj, dict):
            return {k: DecimalEncoder.encode(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [DecimalEncoder.encode(i) for i in obj]
        else:
            return obj

# Fetch countries directly from TMDB API
def load_countries():
    url = "https://api.themoviedb.org/3/watch/providers/regions"
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        countries_data = response.json()
        
        # Extract all country codes
        countries_list = [country['iso_3166_1'] for country in countries_data.get('results', [])]
        print(f"Loaded {len(countries_list)} countries from TMDB API")
        return countries_list
    except Exception as e:
        print(f"Error fetching countries: {e}")
        # Return a minimal default list in case of failure
        return ["US", "GB", "CA", "AU", "DE", "FR", "JP"]

def fetch_data(url):
    """Fetch data from a given URL."""
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an error for bad responses
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from {url}: {e}")
        return {"results": {}}  # Return empty results on error

def process_season_data(season_url, countries_list):
    """
    Fetch and process data for a single season URL.
    
    Args:
        season_url (str): The URL to fetch the season data from.
        countries_list (list of str): List of all countries to include.
    
    Returns:
        dict: Provider data for the given season URL.
    """
    season_data = fetch_data(season_url)
    
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

def aggregate_provider_counts(season_results, countries_list):
    """
    Aggregate provider counts across all seasons while keeping country-wise division.
    
    Args:
        season_results (list of dict): List of provider data from each season.
        countries_list (list of str): List of all countries to include.
    
    Returns:
        dict: Aggregated counts of providers by country.
    """
    aggregated_data = {country: {} for country in countries_list}
    
    for result in season_results:
        for country, providers in result.items():
            if country not in aggregated_data:
                continue
            for provider_key, provider_info in providers.items():
                if provider_key not in aggregated_data[country]:
                    aggregated_data[country][provider_key] = provider_info.copy()
                else:
                    aggregated_data[country][provider_key]['count'] += provider_info['count']
    
    # Convert to format suitable for DynamoDB
    formatted_data = {}
    for country, providers in aggregated_data.items():
        if providers:  # Only include countries with data
            formatted_data[country] = list(providers.values())
    
    return formatted_data

def update_dynamo_document(series_id, data):
    """
    Update a DynamoDB document with the given data.
    
    Args:
        series_id (str): ID of the document to update.
        data (dict): Data to add to the document.
    """
    try:
        # Convert any float values to Decimal for DynamoDB
        encoded_data = DecimalEncoder.encode(data)
        
        # Update the item in DynamoDB
        result = table.update_item(
            Key={'id': series_id},
            UpdateExpression="SET provider_data = :p",
            ExpressionAttributeValues={
                ':p': encoded_data
            },
            ReturnValues="UPDATED_NEW"
        )
        print(f"DynamoDB document '{series_id}' updated successfully.")
        return True
    except ClientError as e:
        print(f"Error updating document {series_id}: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error updating document {series_id}: {e}")
        return False

def process_series(series):
    """
    Process a single TV show, fetching and aggregating data for all seasons.
    
    Args:
        series (dict): The TV show document data.
    """
    try:
        series_id = series['id']
        
        # Convert number_of_seasons to an integer if it's a Decimal
        seasons_count = series.get('number_of_seasons', 0)
        if isinstance(seasons_count, Decimal):
            seasons_count = int(seasons_count)
        
        # Get countries list from the series object (added in main())
        countries_list = series.get('_countries_list', [])
        
        # Skip if no seasons
        if seasons_count <= 0:
            print(f"Skipping series {series_id}: No seasons available")
            return
        
        print(f"Processing series {series_id} with {seasons_count} seasons")
        
        # Construct URLs for each season
        season_urls = [f"https://api.themoviedb.org/3/tv/{series_id}/season/{i}/watch/providers?language=en-US" 
                       for i in range(1, seasons_count + 1)]
        
        # Fetch and process all seasons
        season_results = []
        for season_url in season_urls:
            time.sleep(0.2)  # Add delay to avoid rate limiting
            season_data = process_season_data(season_url, countries_list)
            season_results.append(season_data)
        
        # Aggregate and count provider data
        aggregated_results = aggregate_provider_counts(season_results, countries_list)
        
        # Update DynamoDB document with aggregated results
        update_dynamo_document(series_id, aggregated_results)
        
    except Exception as e:
        print(f"Error processing series {series.get('id', 'unknown')}: {e}")

def main():
    # Fetch the list of countries once at the beginning
    countries_list = load_countries()
    
    # Fetch all series from DynamoDB that don't have provider_data
    print("Fetching series from DynamoDB...")
    try:
        # First attempt to get series without provider_data
        response = table.scan(
            FilterExpression="attribute_not_exists(provider_data)"
        )
        series_list = response['Items']
        
        # If DynamoDB limits results, continue scanning
        while 'LastEvaluatedKey' in response:
            response = table.scan(
                FilterExpression="attribute_not_exists(provider_data)",
                ExclusiveStartKey=response['LastEvaluatedKey']
            )
            series_list.extend(response['Items'])
        
        print(f"Found {len(series_list)} series without provider data")
        
        # Add countries list to each series for processing
        for series in series_list:
            series['_countries_list'] = countries_list
        
        # Determine the number of processes to use
        num_processes = min(cpu_count(), 4)  # Limit to 4 processes to avoid API rate limits
        
        # Process series in parallel
        with Pool(processes=num_processes) as pool:
            pool.map(process_series, series_list)
            
        print("Data fetching and storing complete.")
        
    except Exception as e:
        print(f"Error in main function: {e}")

if __name__ == "__main__":
    main()