import * as cheerio from "cheerio";

export async function scrapeBlogText(url) {
  try {
    const apiKey = process.env.SCRAPERAPI_KEY;
    if (!apiKey) throw new Error("Missing SCRAPERAPI_KEY");

    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `http://api.scraperapi.com?api_key=${apiKey}&url=${encodedUrl}&render=true`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      throw new Error(`ScraperAPI failed with status ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("title").text().trim();

    const content =
      $("article").text().trim() ||
      $(".post-content").text().trim() ||
      $(".blog-post").text().trim() ||
      $("main").text().trim() ||
      $("p")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean)
        .join("\n\n");

    console.log("🧾 Content preview:", content.slice(0, 300));

    if (!content || content.length < 100) {
      throw new Error("Insufficient blog content extracted.");
    }

    return { title, content };
  } catch (err) {
    console.error("❌ scrapeBlogText error:", err.message);
    return null;
  }
}
