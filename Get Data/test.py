import json

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

def write_query_to_file(filename, query):
    with open(filename, 'w') as file:
        json.dump(query, file, indent=4)

# Example usage:
country = "IT"
providers = ["Amazon Prime Video","Netflix","Disney Plus"]

mongo_query = build_mongo_query(country, providers)
write_query_to_file("mongo_query.json", mongo_query)

print(f"Query written to 'mongo_query.json'.")
