import json

# Step 1: Read the input JSON data from a file
input_file = 'providers.json'
with open(input_file, 'r') as file:
    json_array = json.load(file)

# Step 2: Process the data to create a dictionary with provider_name as key and logo_path as value
provider_dict = {item['provider_name']: item['logo_path'] for item in json_array['results']}

# Step 3: Write the resulting dictionary to an output file
output_file = 'provider_dict.json'
with open(output_file, 'w') as file:
    json.dump(provider_dict, file, indent=4)

print(f"Dictionary has been written to {output_file}")
