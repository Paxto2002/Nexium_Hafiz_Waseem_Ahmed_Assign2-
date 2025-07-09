export async function scrapeBlogText(url) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const scraperApiKey = process.env.SCRAPERAPI_KEY;

    if (!scraperApiKey) {
      throw new Error("Missing SCRAPERAPI_KEY in environment variables.");
    }

    // ScraperAPI endpoint with JS rendering and autoparse
    const apiUrl = `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodedUrl}&render=true&autoparse=true`;

    const res = await fetch(apiUrl);

    if (!res.ok) {
      throw new Error(`ScraperAPI failed with status ${res.status}`);
    }

    const data = await res.json();

    const title = data.title?.trim() || "Untitled";
    const content = data.text?.trim() || "";

    if (!content || content.length < 100) {
      throw new Error("Insufficient blog content extracted.");
    }

    return { title, content };
  } catch (error) {
    console.error("❌ scrapeBlogText error:", error.message);
    return null;
  }
}
