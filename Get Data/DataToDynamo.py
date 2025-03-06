import requests
import time
import boto3
from multiprocessing import Pool, cpu_count
from botocore.exceptions import ClientError

# AWS DynamoDB setup
dynamodb = boto3.resource('dynamodb')
table_name = 'SeriesTable'  # Replace with your DynamoDB table name
table = dynamodb.Table(table_name)

# TMDB API headers
headers = {
    "accept": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTU5OC4yMTc0OTEsInN1YiI6IjY2Y2U1YTAxYWFjOTVjODg4YTY2ZDViOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.D1IRi_GiU_9BLWXbl2jGApNVYL_bMDGBPONBvs0XZaE"
}

def fetch_page(page):
    """Function to fetch a single page from the API."""
    url = f'https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page={page}&sort_by=vote_count.desc&vote_count.gte=25'
    response = requests.get(url, headers=headers)
    return response.json().get('results', [])

def item_exists(item_id):
    """Check if an item with the given ID already exists in the table."""
    try:
        response = table.get_item(Key={'id': item_id})
        return 'Item' in response
    except ClientError as e:
        print(f"Error checking if item exists: {e}")
        return False

def store_items(series):
    """Store items in DynamoDB if they don't already exist."""
    with table.batch_writer() as batch:
        for serie in series:
            item_id = str(serie['id'])
            if not item_exists(item_id):
                item = {
                    'id': item_id,
                    'title': serie['name']
                }
                try:
                    batch.put_item(Item=item)
                    print(f"Inserted item {item_id}")
                except ClientError as e:
                    print(f"Error inserting item: {e}")
                    print(f"Item causing error: {item}")
            else:
                print(f"Item {item_id} already exists, skipping")

def fetch_and_store(page):
    """Function to fetch data from the API and store it in DynamoDB."""
    results = fetch_page(page)
    if results:
        store_items(results)
        print(f"Processed page {page} with {len(results)} items")
        return True
    else:
        print(f"Page {page} returned no results")
        return False

def worker(start_page):
    """Worker function for each process to handle a range of pages."""
    page = start_page
    while True:
        try:
            has_results = fetch_and_store(page)
            if not has_results:
                print(f"Worker starting from page {start_page} finished at page {page}")
                break
            page += cpu_count()  # Skip ahead by number of workers
            time.sleep(0.5)  # Add a small delay to avoid rate limiting
        except Exception as e:
            print(f"Error processing page {page}: {e}")
            break

if __name__ == "__main__":
    # Determine the number of processes to use
    num_processes = cpu_count()
    
    # Create a pool of workers
    with Pool(processes=num_processes) as pool:
        # Each worker starts from a different page and increments by num_processes
        starting_pages = range(1, num_processes + 1)
        pool.map(worker, starting_pages)
    
    print("Data fetching and storing complete.")
