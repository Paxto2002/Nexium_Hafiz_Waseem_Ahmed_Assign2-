import { chromium, firefox, webkit } from "playwright";

// Helper to get correct browser launcher
function getBrowserLauncher(type) {
  switch (type) {
    case "firefox":
      return firefox;
    case "webkit":
      return webkit;
    case "chromium":
    default:
      return chromium;
  }
}

/**
 * Scrape blog title and text from a URL using the selected browser engine
 * @param {string} url - The blog URL to scrape
 * @param {'chromium' | 'firefox' | 'webkit'} browserType - Which browser engine to use
 */
export async function scrapeBlogText(url, browserType = "chromium") {
  const browserLauncher = getBrowserLauncher(browserType);

  const browser = await browserLauncher.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    await page.waitForSelector("article, .post-content, .blog-post, main", {
      timeout: 10000,
    });

    const { title, content } = await page.evaluate(() => {
      const title = document.title;
      const container =
        document.querySelector("article") ||
        document.querySelector(".post-content") ||
        document.querySelector(".blog-post") ||
        document.querySelector("main");

      const content = container?.innerText?.trim() || "";
      return {
        title: title?.trim() || "Untitled",
        content,
      };
    });

    await browser.close();

    if (!content || content.length < 100) {
      throw new Error("Insufficient blog content extracted.");
    }

    return { title, content };
  } catch (error) {
    await browser.close();
    console.error(`❌ Failed with ${browserType}:`, error.message);
    return null;
  }
}
