import express from "express";
import cors from "cors";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL is required" });

  try {
    const browser = await puppeteerCore.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // 🚫 Block unnecessary resources for speed
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const blockedResources = ["image", "stylesheet", "font", "media"];
      if (blockedResources.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const start = Date.now();

    // ✅ Wait for full network idle (JS-heavy blogs like IBM)
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 45000,
    });

    // ✅ Wait for at least one likely article selector
    await page.waitForSelector(
      "main, article, .article-content, .entry-content",
      {
        timeout: 10000,
      }
    );

    // 🌀 Scroll to load lazy content
    let previousHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === previousHeight) break;
      previousHeight = newHeight;
    }

    // 🧠 Extract meaningful content
    const content = await page.evaluate(() => {
      const selectors = [
        "main",
        "article",
        "div[itemprop='articleBody']",
        ".post-content",
        ".article-content",
        ".entry-content",
        "#article",
        "#content",
      ];

      for (const selector of selectors) {
        const el = document.querySelector(selector);
        if (el && el.innerText && el.innerText.length > 200) {
          return el.innerText;
        }
      }

      return document.body.innerText || ""; // Final fallback
    });

    const title = await page.title();
    await browser.close();

    console.log(`⏱️ Scraped ${url} in ${Date.now() - start}ms`);
    console.log(`📄 Content length: ${content.length}`);
    console.log(`📃 Title: ${title}`);

    if (!content || content.length < 100) {
      return res.status(400).json({
        error: "Content missing or too short",
        contentLength: content.length,
      });
    }

    res.json({ title, content });
  } catch (err) {
    console.error("❌ Scraper failed:", err.message);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Scraper API is up and running!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
