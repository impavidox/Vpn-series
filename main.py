import requests
from bs4 import BeautifulSoup

# Define the URL of the website you want to scrape
url = 'https://www.justwatch.com/it/serie-tv/the-rookie'

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
}

# Send a GET request to the website
response = requests.get(url, headers=headers)

# Check if the request was successful
if response.status_code == 200:
    # Parse the HTML content of the page with BeautifulSoup
    soup = BeautifulSoup(response.text, 'html.parser')
    stream=soup.find(class_='buybox-row stream')
    # Find all the article titles (assume they are within <h2> tags)
    titles = stream.find_all(class_='offer__icon')

    print(titles)
    # Print the titles of the articles
    for index, title in enumerate(titles, start=1):
        print(f"{index}. {title['alt'].strip()}")

else:
    print(f"Failed to retrieve the page. Status code: {response.status_code}")
