import requests
import time
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from multiprocessing import Pool, cpu_count

# MongoDB setup
uri = "mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['vpn-series-db']
collection = db['series_collectiontmdb']

# TMDB API headers
headers = {
    "accept": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTU5OC4yMTc0OTEsInN1YiI6IjY2Y2U1YTAxYWFjOTVjODg4YTY2ZDViOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.D1IRi_GiU_9BLWXbl2jGApNVYL_bMDGBPONBvs0XZaE"
}

def fetch_and_store(page):
    """Function to fetch data from the API and store it in MongoDB."""
    url = f'https://api.themoviedb.org/3/discover/tv?include_adult=false&include_null_first_air_dates=false&language=en-US&page={page}&sort_by=vote_count.desc&vote_count.gte=25'
    response = requests.get(url, headers=headers).json().get('results', [])
    
    documents = [
        {
            "title": serie['name'],
            "id": serie['id']
        }
        for serie in response
    ]
    
    if documents:  # Ensure there are documents to insert
        collection.insert_many(documents)
        print(f"Inserted page {page}")

if __name__ == "__main__":
    # Define the number of pages to fetch (1 to 408 in your case)
    pages = range(1, 408)
    
    # Determine the number of processes to use (use all available CPUs)
    num_processes = cpu_count()

    # Use a pool of workers to fetch data concurrently
    with Pool(processes=num_processes) as pool:
        pool.map(fetch_and_store, pages)

    print("Data fetching and storing complete.")
