// app/api/blogs/route.js
export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { createClient } from "@supabase/supabase-js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let cachedClient = null;
async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return cachedClient;
}

// Auto scrape using Playwright
async function scrapeBlogText(url, browserType = "chromium") {
  const playwright = await import("playwright");

  const browser = await playwright[browserType].launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForSelector("article, main, body", { timeout: 10000 });

    const { title, content } = await page.evaluate(() => {
      const title = document.title?.trim() || "Untitled";
      const el =
        document.querySelector("article") ||
        document.querySelector("main") ||
        document.querySelector("body");

      const content = el?.innerText?.replace(/\s+/g, " ").trim() || "";

      return { title, content };
    });

    await browser.close();

    if (!content || content.length < 100)
      throw new Error("Not enough blog content extracted.");

    return { title, content };
  } catch (error) {
    await browser.close();
    console.error("❌ Scraper error:", error);
    return null;
  }
}

export async function POST(req) {
  try {
    const { blogUrl } = await req.json();
    if (!/^https?:\/\//.test(blogUrl)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const client = await getMongoClient();
    const col = client.db(MONGODB_DB).collection("blogs");

    const existing = await col.findOne({ blogUrl });
    if (existing) {
      return NextResponse.json({
        message: "Already exists",
        blogText: existing.blogText,
        alreadyExists: true,
      });
    }

    const scraped = await scrapeBlogText(blogUrl);
    if (!scraped) {
      return NextResponse.json({ error: "Scrape failed" }, { status: 400 });
    }

    const { title, content } = scraped;

    // Save in MongoDB
    await col.insertOne({
      blogUrl,
      blogTitle: title,
      blogText: content,
      createdAt: new Date(),
    });

    // 🧠 Generate summary
    const summary_en = generateSummary(content);
    const summary_ur = translateToUrdu(summary_en);

    // Save in Supabase
    const { error } = await supabase.from("summaries").insert({
      blog_url: blogUrl,
      summary_en,
      summary_ur,
    });

    if (error) throw error;

    return NextResponse.json({
      message: "Scraped + Summarized + Translated",
      blogText: content,
      summary_en,
      summary_ur,
    });
  } catch (err) {
    console.error("❌ /api/blogs POST Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const client = await getMongoClient();
    const blogs = await client
      .db(MONGODB_DB)
      .collection("blogs")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json(blogs);
  } catch (err) {
    console.error("❌ GET /api/blogs:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
