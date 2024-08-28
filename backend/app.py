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
    data = collection.find(query_params).limit(50)
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

        # Example: Handle more filters if needed...
        # Retrieve and limit results to 50
    filtered_data = collection.find(query).sort( { 'vote_count': -1 } ).limit(50)

    return dumps(filtered_data)

if __name__ == '__main__':
    app.run(debug=True)
