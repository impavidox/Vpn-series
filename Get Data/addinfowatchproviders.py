import requests
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from multiprocessing import Pool, cpu_count

# Constants and configurations
headers = {
    "accept": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTU5OC4yMTc0OTEsInN1YiI6IjY2Y2U1YTAxYWFjOTVjODg4YTY2ZDViOSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.D1IRi_GiU_9BLWXbl2jGApNVYL_bMDGBPONBvs0XZaE"
}
uri = "mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['vpn-series-db']
collection = db['series_collectiontmdb']
countries_of_interest = [
    "US",  # United States
    "CN",  # China
    "IN",  # India
    "JP",  # Japan
    "DE",  # Germany
    "GB",  # United Kingdom
    "FR",  # France
    "BR",  # Brazil
    "CA",  # Canada
    "AU",  # Australia
    "RU",  # Russia
    "IT",  # Italy
    "ES",  # Spain
    "SE",  # Sweden
    "NL",  # Netherlands
    "CH",  # Switzerland
    "PL",  # Poland
    "BE",  # Belgium
    "AT",  # Austria
    "DK",  # Denmark
    "FI",  # Finland
    "NO",  # Norway
    "IE",  # Ireland
    "PT",  # Portugal
    "GR",  # Greece
    "CZ",  # Czech Republic
    "HU",  # Hungary
    "SK",  # Slovakia
    "RO",  # Romania
    "BG",  # Bulgaria
    "TR",  # Turkey
    "SA",  # Saudi Arabia
    "AR",  # Argentina
    "MX",  # Mexico
    "KR",  # South Korea
    "ID",  # Indonesia
    "VN"   # Vietnam
]


def fetch_data(url):
    """Fetch data from a given URL."""
    response = requests.get(url, headers=headers)
    response.raise_for_status()  # Raise an error for bad responses
    return response.json()

def process_season_data(season_url, countries_of_interest):
    """
    Fetch and process data for a single season URL.
    
    Args:
        season_url (str): The URL to fetch the season data from.
        countries_of_interest (list of str): List of countries to filter results by.
    
    Returns:
        dict: Provider data for the given season URL.
    """
    season_data = fetch_data(season_url)
    
    # Initialize the provider data dictionary
    provider_data = {country: {} for country in countries_of_interest}
    
    for country, country_data in season_data.get('results', {}).items():
        if country not in countries_of_interest:
            continue  # Skip countries not in the list of interest
        
        flatrate_providers = country_data.get('flatrate', [])
        for provider in flatrate_providers:
            provider_name = provider['provider_name']
            if provider_name not in provider_data[country]:
                provider_data[country][provider_name] = 0  # Initialize count
            provider_data[country][provider_name] += 1  # Increment count
    
    return provider_data

def aggregate_provider_counts(season_results):
    """
    Aggregate provider counts across all seasons while keeping country-wise division.
    
    Args:
        season_results (list of dict): List of provider data from each season.
    
    Returns:
        dict: Aggregated counts of providers by country.
    """
    aggregated_data = {country: {} for country in countries_of_interest}
    
    for result in season_results:
        for country, providers in result.items():
            if country not in aggregated_data:
                continue
            for provider_name, count in providers.items():
                if provider_name not in aggregated_data[country]:
                    aggregated_data[country][provider_name] = 0
                aggregated_data[country][provider_name] += count  # Increment count for this provider
    
    return aggregated_data

def update_mongo_document(document_id, data):
    """
    Update a MongoDB document with the given data.
    
    Args:
        document_id (str): ID of the document to update.
        data (dict): Data to add to the document.
    """
    # Update the document with the new data
    collection.update_one(
        {'_id': document_id},
        {'$set': {'provider_data': data}}
    )
    print(f"MongoDB document '{document_id}' updated successfully.")

def process_series(series_data):
    """
    Process a single TV show, fetching and aggregating data for all seasons.
    
    Args:
        series_data (dict): The TV show document data.
    """
    series_id = series_data['id']
    document_id = series_data['_id']
    seasons_count = series_data['number_of_seasons']  # Assumed field for number of seasons
    
    # Construct URLs for each season
    season_urls = [f"https://api.themoviedb.org/3/tv/{series_id}/season/{i}/watch/providers?language=en-US" for i in range(1, seasons_count + 1)]

    # Fetch and process all seasons
    season_results = []
    for season_url in season_urls:
        season_data = process_season_data(season_url, countries_of_interest)
        season_results.append(season_data)
    
    # Aggregate and count provider data
    aggregated_results = aggregate_provider_counts(season_results)
    
    # Update MongoDB document with aggregated results
    update_mongo_document(document_id, aggregated_results)

def main():
    # Fetch all TV show documents
    series_documents = list(collection.find({'provider_data': { '$exists': False }}))  # Adjust query as needed
    num_processes = cpu_count()
    # Process each series in parallel
    with Pool(processes=num_processes) as pool:  # Adjust the number of processes as needed
        pool.map(process_series, series_documents)

if __name__ == "__main__":
    main()
