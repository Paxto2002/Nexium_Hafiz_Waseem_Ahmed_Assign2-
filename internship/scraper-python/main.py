from flask import Flask, request, jsonify
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

app = Flask(__name__)

@app.route('/scrape', methods=['POST'])
def scrape():
    data = request.get_json()
    url = data.get("url")
    if not url:
        return jsonify({"error": "Missing URL"}), 400

    try:
        options = Options()
        options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.binary_location = "/usr/bin/chromium"

        driver = webdriver.Chrome(options=options)
        driver.get(url)

        title = driver.title
        content = driver.find_element("tag name", "body").text

        driver.quit()

        if len(content.strip()) < 100:
            return jsonify({"error": "Insufficient content"}), 400

        return jsonify({"title": title, "content": content[:10000]})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
