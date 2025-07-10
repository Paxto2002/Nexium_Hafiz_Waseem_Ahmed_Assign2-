import express from "express";
import cors from "cors";
import puppeteer from "puppeteer";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });

    const { title, content } = await page.evaluate(() => {
      const title = document.title;
      const container =
        document.querySelector("article") ||
        document.querySelector("main") ||
        document.querySelector(".post-content") ||
        document.querySelector(".blog-post");

      return {
        title,
        content: container?.innerText?.trim() || "",
      };
    });

    await browser.close();

    if (!content || content.length < 100) {
      return res.status(400).json({ error: "Insufficient content" });
    }

    return res.json({ title, content });
  } catch (err) {
    console.error("❌ Scraping failed:", err.message);
    return res.status(500).json({ error: "Scraping failed" });
  }
});

app.listen(3000, () =>
  console.log("🚀 Scraper API running on http://localhost:3000")
);
