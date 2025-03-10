import requests
import json
import time
from collections import defaultdict

# Load the country dictionary
with open('country_dict.json', 'r') as f:
    country_dict = json.load(f)

# API settings
url_template = "https://api.themoviedb.org/3/watch/providers/tv?language=en-US&watch_region={}"
headers = {
    "accept": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJlNjBmZDE0NTFmNTJkZjRkNzFhZjcyOTU1MTEwODM1MCIsIm5iZiI6MTcyNDc5OTQ4OS42LCJzdWIiOiI2NmNlNWEwMWFhYzk1Yzg4OGE2NmQ1YjkiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.ntuRHqANPqhjnRT-ltKzy-oiLNiVgymLSEP2Kr2dWtU"
}

# Dictionary to store results
country_providers = {}

# Process each country
for country_code, country_name in country_dict.items():
    print(f"Processing {country_name} ({country_code})...")
    
    # Construct URL with current country code
    url = url_template.format(country_code)
    
    try:
        # Make API request
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        
        data = response.json()
        
        # Extract providers with display_priority < 20
        top_providers = []
        if 'results' in data:
            for provider in data['results']:
                temp_prio=provider['display_priorities'][country_code]
                if temp_prio <= 20:
                    top_providers.append({
                        'provider_id': provider.get('provider_id'),
                        'provider_name': provider.get('provider_name'),
                        'display_priority': temp_prio
                    })
        
        # Sort by display priority
        top_providers.sort(key=lambda x: x.get('display_priority', 100))
        
        # Store in results dictionary
        country_providers[country_code] = {
            'providers': top_providers
        }
        
        # Sleep to avoid hitting rate limits
        time.sleep(0.25)
        
    except requests.exceptions.RequestException as e:
        print(f"Error processing {country_name}: {e}")
        # Store error in results
        country_providers[country_code] = {
            'country_name': country_name,
            'error': str(e),
            'providers': []
        }

# Save results to file
output_file = 'country_streaming_providers.json'
with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(country_providers, f, indent=2, ensure_ascii=False)

print(f"\nCompleted! Results saved to {output_file}")

# Generate a summary report
provider_frequency = defaultdict(int)
country_count = 0

for country_data in country_providers.values():
    if country_data.get('providers'):
        country_count += 1
        for provider in country_data['providers']:
            provider_frequency[provider['provider_name']] += 1

print(f"\nData collected for {country_count} countries")
print("\nTop 10 most common streaming providers globally:")
for provider, count in sorted(provider_frequency.items(), key=lambda x: x[1], reverse=True)[:10]:
    print(f"{provider}: Available in {count} countries ({round(count/country_count*100, 1)}%)")