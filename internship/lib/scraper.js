export async function scrapeBlogText(url) {
  try {
    const SCRAPER_API_BASE =
      process.env.NEXT_PUBLIC_SCRAPER_API_URL || "http://localhost:3000";

    if (!url || !/^https?:\/\//.test(url)) {
      throw new Error("Invalid URL format");
    }

    const response = await fetch(`${SCRAPER_API_BASE}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: "Scraper failed with non-JSON response",
      }));
      throw new Error(errorData.error || "Scraper API failed");
    }

    const { title, content } = await response.json();
    if (!content || content.length < 100) {
      throw new Error("Insufficient blog content extracted");
    }

    return { title, content };
  } catch (err) {
    console.error("❌ scrapeBlogText error:", err.message);
    return null;
  }
}
