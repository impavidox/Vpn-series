from flask import Flask, request, jsonify
from pymongo import MongoClient
from flask_cors import CORS
from bson.json_util import dumps

app = Flask(__name__)
CORS(app)  # Enable CORS

# Connect to MongoDB
client = MongoClient('your_mongodb_connection_string')
db = client['your_database_name']
collection = db['your_collection_name']

@app.route('/api/data', methods=['GET'])
def get_data():
    query_params = request.args.to_dict()
    data = collection.find(query_params)
    return dumps(data)

@app.route('/api/filter', methods=['POST'])
def filter_data():
    filter_criteria = request.json
    filtered_data = collection.find(filter_criteria)
    return dumps(filtered_data)

if __name__ == '__main__':
    app.run(debug=True)
