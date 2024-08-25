from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
import time

# Set up the Chrome WebDriver
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Run in headless mode (no browser window)
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Define the URL
url = 'https://www.justwatch.com/us/tv-shows?genres=act,cmy,crm,drm,fnt,rma,scf,trl&providers=aat,adp,aep,aho,amp,amz,app,atp,azp,bba,cra,cru,dnp,fuv,hlu,itu,koc,mxx,nfx,pct,ply,pmp,ppa,pst,rkc,szt,yot&release_year_from=2024&rating_imdb=4&sort_by=title'

# Open the URL
driver.get(url)
time.sleep(5)
# Scroll down the page to load more content
scroll_pause_time = 2  # Time to wait for the next load
last_height = driver.execute_script("return document.body.scrollHeight")
print(last_height)
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
stream = driver.find_elements(By.CLASS_NAME, 'picture-comp__img')
print(len(stream))
# for serie in stream:
#     print(serie.get_attribute('alt'))

# Close the driver
driver.quit()


