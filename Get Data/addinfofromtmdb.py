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
series_list = list(collection.find({'year' : { '$exists' : False }}, {"id": 1, "_id": 1}))
print(len(series_list))



# TMDB API headers
headers = {
    "accept": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTU5OC4yMTc0OTEsInN1YiI6IjY2Y2U1YTAxYWFjOTVjODg4YTY2ZDViOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.D1IRi_GiU_9BLWXbl2jGApNVYL_bMDGBPONBvs0XZaE"
}

def fetch_and_store(series):
    """Function to fetch data from the API and store it in MongoDB."""
    url = f"https://api.themoviedb.org/3/tv/{series['id']}?append_to_response=credits&language=en-US"
    response = requests.get(url, headers=headers).json()
    print(series['id'])

    update_data = {
        "backdrop_path": response.get('backdrop_path', ''),
        "episode_run_time": response.get('episode_run_time', [0])[0] if response.get('episode_run_time') else 0,
        "genres": [genre['name'] for genre in response.get('genres', [])],
        "number_of_episodes": response.get('number_of_episodes', 0),
        "number_of_seasons": response.get('number_of_seasons', 0),
        "popularity": response.get('popularity', 0),
        "poster_path": response.get('poster_path', ''),
        "vote_average": response.get('vote_average', 0),
        "vote_count": response.get('vote_count', 0),
        "plot": response.get('overview', ''),
        "actors": [actor['name'] for actor in response.get('credits', {}).get('cast', [])[:3]],
        "year": response.get('first_air_date','').split('-')[0] if response.get('first_air_date','') else None
    }
    
    
    filter = {"_id": series['_id']}
    update_doc = {"$set": update_data}
    result = collection.update_one(filter, update_doc)


if __name__ == "__main__":
    # Define the number of pages to fetch (1 to 408 in your case)

    
    # Determine the number of processes to use (use all available CPUs)
    num_processes = cpu_count()

    # Use a pool of workers to fetch data concurrently
    with Pool(processes=num_processes) as pool:
        pool.map(fetch_and_store, series_list)

    print("Data fetching and storing complete.")
