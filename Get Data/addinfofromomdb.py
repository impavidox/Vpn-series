import requests
from pymongo import MongoClient
from bson.objectid import ObjectId
import re

mongo_uri = 'mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
client = MongoClient(mongo_uri)
database = client['vpn-series-db']  # Replace with your database name
collection = database['series_collection']  # Replace with your collection name
year=2013
series = list(collection.find({"year": year, "type" : None}, {"title": 1, "_id": 1}))

def fetch_data_and_update_document(title,document_id):
    title = re.sub(r'[^A-Za-z0-9\s]', '', title)
    #title=title.replace(' ','+')
    api_url = f'http://www.omdbapi.com/?s={title}&type=series&apikey=984adbd3&y={year}'  # Replace with your actual API URL
    

    try:
        # Make the API call
        response = requests.get(api_url)
        response.raise_for_status()  # Raise an exception for HTTP errors
        api_data = response.json()
        result=api_data.get("Search")
        id=result[0]['imdbID']
        newlink=f'http://www.omdbapi.com/?i={id}&plot=full&apikey=984adbd3'
        response = requests.get(newlink)
        response.raise_for_status()  # Raise an exception for HTTP errors
        api_data = response.json()
        
        genre_list = api_data.get("Genre", "").split(", ")

        # Extract the necessary data from the API response
        update_data = {
            "released": api_data.get("Released"),
            "genre": genre_list,
            "actors": api_data.get("Actors"),
            "plot": api_data.get("Plot"),
            "language": api_data.get("Language"),
            "country": api_data.get("Country"),
            "poster": api_data.get("Poster"),
            "imdbRating": api_data.get("imdbRating"),
            "imdbVotes": api_data.get("imdbVotes"),
            "imdbID": api_data.get("imdbID"),
            "type": api_data.get("Type"),
            "totalSeasons": api_data.get("totalSeasons")
        }



        # Update the document in MongoDB
        filter = {"_id": document_id}
        update_doc = {"$set": update_data}
        result = collection.update_one(filter, update_doc)


    except requests.exceptions.RequestException as e:
        print(f"Error fetching data from API: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")


# Run the function
count=0
len=len(series)
for serie in series:
    fetch_data_and_update_document(serie['title'],serie['_id'])
    count=count+1
    print(f'Updated {count} out of {len}')
