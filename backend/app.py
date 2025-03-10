from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from bson.json_util import dumps
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# MongoDB setup
client = MongoClient('mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['vpn-series-db']
collection = db['series_collectiontmdb']

@app.route('/api/data', methods=['GET'])
def get_data():
    query_params = request.args.to_dict()  # Convert query parameters to a dictionary
    data = collection.find(query_params).limit(56)
    return dumps(data)  # Return JSON response

@app.route('/api/filter', methods=['POST'])
def filter_data():
    filter_criteria = request.json
    query = {}
    if filter_criteria:
        
        # Example: Handle title filtering with partial match (case-insensitive)
        if 'title' in filter_criteria:
            query['title'] = {'$regex': re.escape(filter_criteria['title']), '$options': 'i'}

        # Example: Handle year filtering
        if 'year' in filter_criteria:
            query['year'] = str(filter_criteria['year'])

        if 'genres' in filter_criteria:
            query['genres'] = { '$all': filter_criteria['genres'] }
    page = int(filter_criteria.get('page', 1))
    limit = 56  # Number of results per page
    skip = (page - 1) * limit  # Calculate the number of documents to skip
    query_user=build_mongo_query(filter_criteria['country'],filter_criteria['streaming'])
    # Retrieve and limit results to the requested page
    combined_query = {**query_user, **query}
    filtered_data = list(collection.find(combined_query).sort('vote_count', -1).skip(skip).limit(limit))
    return dumps(filtered_data)


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


if __name__ == '__main__':
    app.run(debug=True)
