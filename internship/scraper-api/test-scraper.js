// scraper-api/test-scraper.js
import fetch from "node-fetch";

const url = "http://localhost:3000/scrape";
const apiKey = "d2b616d4114668c951c05f37a6a55c4f";

const blogUrl =
  "https://www.gokitetours.com/egypt-tourist-attractions-you-cant-miss-on-your-journey/";

async function testScrape() {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ url: blogUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("❌ Scrape failed:", data.error);
    } else {
      console.log("✅ Scrape successful");
      console.log("Title:", data.title);
      console.log("Preview:", data.content.slice(0, 500));
    }
  } catch (err) {
    console.error("❌ Error testing scraper:", err.message);
  }
}

testScrape();
