export async function scrapeBlogText(url) {
  try {
    const res = await fetch("http://localhost:3000/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Scraper API failed");
    }

    const { title, content } = await res.json();

    console.log("📄 Scraped content preview:", content.slice(0, 300));

    if (!content || content.length < 100) {
      throw new Error("Insufficient blog content extracted.");
    }

    return { title, content };
  } catch (err) {
    console.error("❌ scrapeBlogText error:", err.message);
    return null;
  }
}
