from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time
from pymongo import MongoClient
from pymongo.server_api import ServerApi

uri = "mongodb+srv://aantonaci47:LcvU0AMhm3jBAZQA@cluster0.sw3rz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(uri, server_api=ServerApi('1'))

db = client['vpn-series-db']
collection = db['series_collection']


# Set up the Chrome WebDriver
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Run in headless mode (no browser window)
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

for year in range(1990,2025):
    # Define the URL
    
    url = f'https://www.justwatch.com/us/tv-shows?genres=act,cmy,crm,drm,fnt,rma,scf,trl&providers=aat,adp,aep,aho,amp,amz,app,atp,azp,bba,cra,cru,dnp,fuv,hlu,itu,koc,mxx,nfx,pct,ply,pmp,ppa,pst,rkc,szt,yot&release_year_from='+str(year)+'&release_year_until='+str(year)+'&rating_imdb=4&sort_by=title'
    print(url)
    # Open the URL
    time.sleep(5)
    driver.get(url)
    time.sleep(5)
    # Scroll down the page to load more content
    scroll_pause_time = 2  # Time to wait for the next load
    last_height = driver.execute_script("return document.body.scrollHeight")

    while True:
        # Scroll down to the bottom
        driver.execute_script("window.scrollTo(0,document.body.scrollHeight);")

        # Wait for the page to load
        time.sleep(scroll_pause_time)

        # Calculate new scroll height and compare with last scroll height
        new_height = driver.execute_script("return document.body.scrollHeight")
        if new_height == last_height:
            break
        last_height = new_height

    # Extract data after scrolling
    stream = driver.find_elements(By.CLASS_NAME, 'title-list-grid__item')
    
    documents = [
        {
            "title": serie.get_attribute('data-title'),
            "url": (url := serie.find_element(By.TAG_NAME, 'a').get_attribute('href')),
            "title-url": url.rsplit('/', 1)[-1],
            "year": year
        }
    for serie in stream
    ]
    
    if documents:  # Ensure there are documents to insert
        collection.insert_many(documents)

    # for serie in stream:
    #     print(serie.get_attribute('data-title'))
    #     serie=serie.find_element(By.TAG_NAME,'a')
    #     url=serie.get_attribute('href')
    #     print(url)
    #     print(url.rsplit('/', 1)[-1])

    # Close the driver
driver.quit()


