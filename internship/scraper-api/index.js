app.post("/scrape", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing URL" });

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });

    // Wait for body just to ensure page fully loads
    await page.waitForSelector("body", { timeout: 10000 });

    const { title, content } = await page.evaluate(() => {
      const title = document.title;

      const preferred =
        document.querySelector("article") ||
        document.querySelector("main") ||
        document.querySelector(".post-content") ||
        document.querySelector(".blog-post") ||
        document.querySelector(".blog-content");

      let content = preferred?.innerText?.trim();

      // Fallback to full body if container fails
      if (!content || content.length < 100) {
        content = document.body.innerText.trim();
      }

      return { title, content };
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
