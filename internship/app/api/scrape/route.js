export const runtime = "nodejs"; // Required for Puppeteer on Vercel

import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const blocked = ["image", "stylesheet", "font", "media"];
      if (blocked.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const start = Date.now();

    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });

    await page.waitForSelector(
      "main, article, .article-content, .entry-content",
      { timeout: 10000 }
    );

    let previousHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      const newHeight = await page.evaluate(() => document.body.scrollHeight);
      if (newHeight === previousHeight) break;
      previousHeight = newHeight;
    }

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
      return document.body.innerText || "";
    });

    const title = await page.title();
    await browser.close();

    console.log(`⏱️ Scraped ${url} in ${Date.now() - start}ms`);
    console.log(`📄 Content length: ${content.length}`);
    console.log(`📃 Title: ${title}`);

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: "Content missing or too short" },
        { status: 400 }
      );
    }

    return NextResponse.json({ title, content });
  } catch (err) {
    console.error("❌ Scraper failed:", err);
    return NextResponse.json(
      { error: "Scraping failed", details: err.message },
      { status: 500 }
    );
  }
}
