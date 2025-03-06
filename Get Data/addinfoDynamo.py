import requests
import time
import boto3
import decimal
from multiprocessing import Pool, cpu_count
from botocore.exceptions import ClientError
from decimal import Decimal

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

# First, scan the table to get all existing items
print("Fetching existing series from DynamoDB...")
response = table.scan()
series_list = response['Items']

# If there are more items (DynamoDB limits results to 1MB), continue scanning
while 'LastEvaluatedKey' in response:
    response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
    series_list.extend(response['Items'])

print(f"Found {len(series_list)} series in DynamoDB")

# TMDB API headers
headers = {
    "accept": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTQ4OS42LCJzdWIiOiI2NmNlNWEwMWFhYzk1Yzg4OGE2NmQ1YjkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.ntuRHqANPqhjnRT-ltKzy-oiLNiVgymLSEP2Kr2dWtU"
}

def fetch_and_store(series):
    """Function to fetch data from the API and store it in DynamoDB."""
    try:
        series_id = series['id']
        url = f"https://api.themoviedb.org/3/tv/{series_id}?append_to_response=credits&language=en-US"
        response = requests.get(url, headers=headers).json()
        print(f"Processing series ID: {series_id}")
        
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
            # Format actors as a normal array of strings
            actors = [actor['name'] for actor in response['credits']['cast'][:3]]
        
        # Define the fields to update
        update_fields = {
            "backdrop_path": response.get('backdrop_path', ''),
            "episode_run_time": episode_run_time,
            "genres": [genre['name'] for genre in response.get('genres', [])],  # Simple string array
            "number_of_episodes": response.get('number_of_episodes', 0),
            "number_of_seasons": response.get('number_of_seasons', 0),
            "popularity": DecimalEncoder.encode(response.get('popularity', 0)),
            "poster_path": response.get('poster_path', ''),
            "vote_average": DecimalEncoder.encode(response.get('vote_average', 0)),
            "vote_count": response.get('vote_count', 0),
            "plot": response.get('overview', ''),
            "actors": actors,  # Already updated to be a simple string array
            "year": year
        }
        
        # Prepare update expression and attribute values
        update_expression = "SET "
        expression_attribute_values = {}
        expression_attribute_names = {}
        
        # Build the update expression
        for i, (key, value) in enumerate(update_fields.items()):
            update_expression += f"#{key} = :{key}"
            expression_attribute_values[f":{key}"] = value
            expression_attribute_names[f"#{key}"] = key
            
            if i < len(update_fields) - 1:
                update_expression += ", "
        
        # Update the item in DynamoDB
        result = table.update_item(
            Key={'id': series_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_attribute_values,
            ExpressionAttributeNames=expression_attribute_names,
            ReturnValues="UPDATED_NEW"
        )
        
        # Add a small delay to avoid exceeding DynamoDB's provisioned throughput
        time.sleep(0.05)
        
    except Exception as e:
        print(f"Error processing series {series.get('id', 'unknown')}: {str(e)}")

# Lambda handler removed for local execution

if __name__ == "__main__":
    # For local execution, use multiprocessing
    num_processes = min(cpu_count(), 4)  # Limit to 4 processes to avoid API rate limits
    
    # Add a delay between API calls to avoid rate limiting
    time.sleep(0.2)
    
    # Use a pool of workers to fetch data concurrently
    with Pool(processes=num_processes) as pool:
        pool.map(fetch_and_store, series_list)
    
    print("Data fetching and storing complete.")