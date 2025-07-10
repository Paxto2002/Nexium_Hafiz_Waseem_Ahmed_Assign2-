import express from "express";
import cors from "cors";
import puppeteerCore from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Enhanced CORS Configuration ────────────────────────────
app.use(
  cors({
    origin: [
      "https://blogtalkhees.vercel.app",
      "https://*.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "User-Agent",
    ],
    maxAge: 86400, // 24 hours
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Security Headers ───────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ─── Request Logging ────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  next();
});

// ─── Health Check Endpoint ──────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "✅ Scraper API is up and running!",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: "1.0.0",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
  });
});

// ─── Keep-Alive Endpoint ────────────────────────────────────
app.get("/ping", (req, res) => {
  res.json({
    pong: Date.now(),
    timestamp: new Date().toISOString(),
  });
});

// ─── Enhanced Scraping Endpoint ─────────────────────────────
app.post("/scrape", async (req, res) => {
  const requestId = Math.random().toString(36).substring(7);
  const startTime = Date.now();

  // Log incoming request
  console.log(`🔍 [${requestId}] Scrape request received:`, {
    url: req.body.url,
    userAgent: req.headers["user-agent"],
    timestamp: new Date().toISOString(),
  });

  const { url } = req.body;

  if (!url) {
    console.log(`❌ [${requestId}] No URL provided`);
    return res.status(400).json({
      error: "URL is required",
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch (urlError) {
    console.log(`❌ [${requestId}] Invalid URL format: ${url}`);
    return res.status(400).json({
      error: "Invalid URL format",
      requestId,
      timestamp: new Date().toISOString(),
    });
  }

  let browser;
  try {
    console.log(`🚀 [${requestId}] Starting browser launch...`);

    // Enhanced browser configuration with better SSL handling
    browser = await puppeteerCore.launch({
      args: [
        ...chromium.args,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--ignore-certificate-errors",
        "--ignore-ssl-errors",
        "--ignore-certificate-errors-spki-list",
        "--ignore-certificate-errors-skip-list",
        "--disable-web-security",
        "--disable-features=TranslateUI",
        "--disable-ipc-flooding-protection",
        "--memory-pressure-off",
        "--max_old_space_size=4096",
      ],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      timeout: 30000,
    });

    console.log(`✅ [${requestId}] Browser launched successfully`);

    const page = await browser.newPage();

    // Set longer timeouts
    page.setDefaultNavigationTimeout(45000);
    page.setDefaultTimeout(45000);

    // Enhanced user agent
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

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

    console.log(`🌐 [${requestId}] Navigating to: ${url}`);

    // Navigation with retry logic
    let navigationSuccess = false;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        // ✅ Wait for full network idle (JS-heavy blogs like IBM)
        await page.goto(url, {
          waitUntil: "networkidle2",
          timeout: 45000,
        });
        navigationSuccess = true;
        console.log(
          `✅ [${requestId}] Navigation successful on attempt ${attempt}`
        );
        break;
      } catch (navError) {
        console.log(
          `⚠️ [${requestId}] Navigation attempt ${attempt} failed: ${navError.message}`
        );
        if (attempt === 3) {
          throw navError;
        }
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    if (!navigationSuccess) {
      throw new Error("Failed to navigate to URL after 3 attempts");
    }

    // ✅ Wait for at least one likely article selector
    try {
      await page.waitForSelector(
        "main, article, .article-content, .entry-content",
        {
          timeout: 10000,
        }
      );
      console.log(`✅ [${requestId}] Article selector found`);
    } catch (selectorError) {
      console.log(
        `⚠️ [${requestId}] Article selector not found, continuing: ${selectorError.message}`
      );
    }

    // 🌀 Scroll to load lazy content
    console.log(`🔄 [${requestId}] Scrolling to load lazy content...`);
    let previousHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === previousHeight) break;
      previousHeight = newHeight;
    }

    // 🧠 Extract meaningful content
    console.log(`📄 [${requestId}] Extracting content...`);
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
        ".content",
        ".post",
        ".blog-post",
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
    const processingTime = Date.now() - startTime;

    console.log(
      `✅ [${requestId}] Scraped successfully in ${processingTime}ms`
    );
    console.log(`📄 [${requestId}] Content length: ${content.length}`);
    console.log(`📃 [${requestId}] Title: ${title}`);

    if (!content || content.length < 100) {
      console.log(
        `❌ [${requestId}] Content too short: ${content.length} characters`
      );
      return res.status(400).json({
        error: "Content missing or too short",
        contentLength: content.length,
        requestId,
        processingTime: `${processingTime}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    res.json({
      title,
      content,
      requestId,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error(
      `❌ [${requestId}] Scraper failed after ${processingTime}ms:`,
      err.message
    );
    console.error(`❌ [${requestId}] Stack trace:`, err.stack);

    res.status(500).json({
      error: "Scraping failed",
      details: err.message,
      requestId,
      processingTime: `${processingTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log(`🔒 [${requestId}] Browser closed`);
      } catch (closeError) {
        console.error(
          `❌ [${requestId}] Error closing browser:`,
          closeError.message
        );
      }
    }
  }
});

// ─── Enhanced Server Configuration ──────────────────────────
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
});

// Enhanced server timeouts
server.keepAliveTimeout = 120000; // 2 minutes
server.headersTimeout = 120000; // 2 minutes
server.timeout = 60000; // 1 minute

// ─── Graceful Shutdown ──────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("🔒 Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("🔒 Server closed");
    process.exit(0);
  });
});

// ─── Keep Process Alive ─────────────────────────────────────
setInterval(() => {
  console.log(`💗 Keep alive ping: ${new Date().toISOString()}`);
}, 4 * 60 * 1000); // Every 4 minutes

// ─── Memory Monitoring ──────────────────────────────────────
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`📊 Memory usage: ${JSON.stringify(memUsage)}`);
}, 10 * 60 * 1000); // Every 10 minutes

export default app;
