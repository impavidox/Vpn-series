from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from selenium.common.exceptions import NoSuchElementException


uri = "mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(uri, server_api=ServerApi('1'))

db = client['vpn-series-db']
collection = db['series_collection']
countries = db['series_country']




# Set up the Chrome WebDriver
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Run in headless mode (no browser window)
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--disable-search-engine-choice-screen")
options.add_argument("--log-level=3")  # Suppress INFO and WARNING logs
options.add_argument("--silent")  # Additional flag to reduce logging
options.add_argument("--disable-logging")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)
setLinks=set()
# Define the URL of the website you want to scrape
url = 'https://www.justwatch.com/us/tv-show/the-rookie'

tv_show_data = {
    "title": "The Rookie",
    "available_in": []
}

driver.get(url)
time.sleep(5)

links=driver.find_elements(By.XPATH, "//link[@rel='alternate']")
for link in links:
    setLinks.add(link.get_attribute('href'))


for country_link in setLinks:
    driver.get(country_link)
    time.sleep(5)
    platforms = []
    print(country_link)
    try:
        stream=driver.find_element(By.XPATH, "//*[@class='buybox-row stream']")
        platform_elements = stream.find_elements(By.CLASS_NAME,"offer")
        
    except NoSuchElementException:
        platform_elements=[]
        print(country_link+' no stream')
        
    
    for platform in platform_elements:
            platform_name = platform.find_element(By.TAG_NAME,'img').get_attribute('alt')
            seasons_available = platform.find_element(By.CLASS_NAME, "offer__label").get_attribute("textContent")
            print(seasons_available)
            seasons_available=seasons_available.split()[0]
            print(seasons_available)
            platforms.append({
                "name": platform_name,
                "seasons": seasons_available
            })
    # Add the data to the tv_show_data dictionary
    tv_show_data["available_in"].append({
        "country":  country_link.split('/')[3],
        "platforms": platforms
    })
    
countries.insert_one(tv_show_data)

# element = driver.find_element(By.CLASS_NAME, 'country-switcher__button')

# # Scroll the element into view using JavaScript
# driver.execute_script("arguments[0].scrollIntoView(true);", element)
# time.sleep(2)  # wait a bit for the scroll to happen

# # Click the element
# element.click()
# time.sleep(5)
# stream = driver.find_elements(By.CLASS_NAME, 'country-list-item__text')
# nazioni_set = set(nazione.get_attribute("textContent").strip() for nazione in stream)
# print(len(nazioni_set),nazioni_set)
driver.quit()

