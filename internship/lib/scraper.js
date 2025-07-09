import * as cheerio from "cheerio";

export async function scrapeBlogText(url) {
  try {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("title").text().trim();
    const container =
      $("article").text() ||
      $(".post-content").text() ||
      $(".blog-post").text() ||
      $("main").text();

    const content = container.trim();

    if (!content || content.length < 100) {
      throw new Error("Insufficient blog content extracted.");
    }

    return { title, content };
  } catch (error) {
    console.error("❌ scrapeBlogText error:", error.message);
    return null;
  }
}
