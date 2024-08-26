import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import re
import multiprocessing
import time
import random
import logging

# MongoDB connection setup
uri = "mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri, server_api=ServerApi('1'))
db = client['vpn-series-db']
series_collection = db['series_collection']
countries = db['series_country']

# Headers to simulate a real browser request
user_agents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:91.0) Gecko/20100101 Firefox/91.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36',
    # Add more user-agents as needed
]

def load_proxies_from_file(file_path):
    proxies_list = []

    with open(file_path, 'r') as file:
        for line in file:
            line = line.strip()  # Remove any leading/trailing whitespace
            if line:
                # Example line format: ip:port:user:password
                try:
                    ip_port_user_pass = line.split(':')
                    if len(ip_port_user_pass) == 4:
                        ip, port, username, password = ip_port_user_pass

                        # Create the proxy URL with authentication
                        proxy_url = f'http://{username}:{password}@{ip}:{port}'
                        proxy_dict = {
                            'http': proxy_url,
                            'https': proxy_url
                        }
                        proxies_list.append(proxy_dict)
                    else:
                        print(f"Skipping invalid proxy entry: {line}")
                except ValueError:
                    # Handle any unexpected errors
                    print(f"Error processing proxy entry: {line}")
    
    return proxies_list

# Example usage
file_path = 'Vpn-series\proxy.txt'  # Replace with your file path
proxies = load_proxies_from_file(file_path)
proxies = proxies[0]



# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

def extract_single_number(text):
    """Extracts the first sequence of digits from the string."""
    match = re.search(r'\d+', text)
    return int(match.group()) if match else None

def get_random_proxy():
    """Selects a random proxy from the list."""
    return proxies

def fetch_with_retries(url, headers, proxies, max_retries=20, delay=1):
    """Fetches a URL with retries in case of failure."""
    attempt = 0
    while attempt < max_retries:
        try:
            response = requests.get(url, headers=headers, proxies=proxies, timeout=10)
            response.raise_for_status()
            return response
        except requests.RequestException as e:
            proxies = get_random_proxy()
            attempt += 1
            #logging.error(f"Request failed for URL {url} on attempt {attempt}: {e}")
            # if attempt < max_retries:
            #     time.sleep(delay)
    logging.error(f"Request failed for URL {url} after {max_retries} attempts.")
    return None

def scrape_and_store_data(url):
    """Scrapes data from the URL and stores it in MongoDB."""
    setLinks = set()
    
    try:
        # Choose a random user agent and proxy for the main request
        headers = {
            'User-Agent': random.choice(user_agents)
        }
        proxies = get_random_proxy()

        # Fetch the main URL with retry logic
        response = fetch_with_retries(url, headers, proxies)
        if response is None:
            return  # Skip processing if request failed
        #time.sleep(random.uniform(1, 3))  # Random delay between requests
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract the alternate links
        links = soup.find_all('link', rel='alternate')
        for link in links:
            href = link.get('href')
            if href:
                setLinks.add(href)

        # Extract the TV show title
        h1_tag = soup.find('h1', class_='title-detail-hero__details__title')
        if h1_tag:
            tv_show_title = h1_tag.get_text(strip=True).split('(')[0].strip()
        else:
            tv_show_title = url
            logging.warning(f"Failed to extract title from: {url}")

        tv_show_data = {
            "title": tv_show_title,
            "available_in": []
        }

        # Iterate over the country-specific links
        for country_link in setLinks:
            try:
                # Choose a new random proxy for each request
                country_proxies = get_random_proxy()

                # Fetch country-specific URL with retry logic
                country_response = fetch_with_retries(country_link, headers, country_proxies)
                if country_response is None:
                    continue  # Skip processing if request failed
                #time.sleep(random.uniform(1, 3))  # Random delay between requests
                country_soup = BeautifulSoup(country_response.content, 'html.parser')
                platforms = []

                # Find the stream element by its class
                stream = country_soup.find('div', class_='buybox-row stream')
                if stream:
                    platform_elements = stream.find_all('a', class_='offer')
                    for platform in platform_elements:
                        platform_name = platform.find('img')['alt']
                        seasons_available = extract_single_number(platform.find('div', class_='offer__label').get_text())
                        platforms.append({
                            "name": platform_name,
                            "seasons": seasons_available
                        })

                tv_show_data["available_in"].append({
                    "country": country_link.split('/')[3],
                    "platforms": platforms
                })

            except requests.RequestException as e:
                logging.error(f"Request failed for country link {country_link}: {e}")
            except Exception as e:
                logging.error(f"An error occurred with country link {country_link}: {e}")

        # Insert the data into MongoDB
        countries.insert_one(tv_show_data)

    except requests.RequestException as e:
        logging.error(f"Request failed for URL {url}: {e}")
    except Exception as e:
        logging.error(f"An error occurred with URL {url}: {e}")

def get_urls_from_mongo(year):
    """Queries MongoDB to get URLs filtered by the year."""
    urls = series_collection.find({"year": year}, {"url": 1, "_id": 0})
    return [doc['url'] for doc in urls]

def main(year):
    """Main function to scrape and store data in parallel."""
    urls = get_urls_from_mongo(year)
    with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
        pool.map(scrape_and_store_data, urls)

if __name__ == "__main__":
    year_to_filter = 2014
    main(year_to_filter)
