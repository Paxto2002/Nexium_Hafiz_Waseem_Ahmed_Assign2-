import express from "express";
import cors from "cors";
import chromium from "@sparticuz/chromium-min";
import puppeteerCore from "puppeteer-core";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;

    const browser = await (isProd
      ? puppeteerCore.launch({
          args: chromium.args,
          executablePath: await chromium.executablePath(
            // Optional: Point to CDN if default path fails
            "https://github.com/Sparticuz/chromium/releases/download/v133.0.0/chromium-v133.0.0-pack.tar"
          ),
          headless: chromium.headless,
        })
      : puppeteerCore.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        }));

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    const title = await page.title();
    const content = await page.evaluate(() => document.body.innerText);

    await browser.close();

    if (!content || content.length < 100) {
      return res.status(400).json({ error: "Insufficient content extracted" });
    }

    res.json({ title, content });
  } catch (err) {
    console.error("❌ Scraping error:", err);
    res.status(500).json({ error: "Scraping failed", details: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Scraper API listening on port ${PORT}`);
});
