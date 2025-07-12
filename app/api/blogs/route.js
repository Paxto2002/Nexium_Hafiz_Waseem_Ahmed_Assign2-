export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { scrapeBlogText } from "@/lib/scraper";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

let cachedClient = null;
async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

export async function POST(req) {
  try {
    let blogUrl;
    try {
      const body = await req.json();
      blogUrl = body.blogUrl;
    } catch (err) {
      console.error("❌ Invalid JSON body:", err);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!/^https?:\/\//.test(blogUrl)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
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

    if (!scraped || !scraped.content || scraped.content.length < 100) {
      console.error("❌ Scraping failed or content too short:", scraped);
      return NextResponse.json(
        {
          error:
            "Scraping failed — the page may be dynamic or has no readable text.",
        },
        { status: 400 }
      );
    }

    const { title, content } = scraped;

    await col.insertOne({
      blogUrl,
      blogTitle: title || "Untitled",
      blogText: content,
      createdAt: new Date(),
    });

    return NextResponse.json({
      message: "✅ Blog saved to MongoDB",
      blogText: content,
      alreadyExists: false,
    });
  } catch (err) {
    console.error("❌ POST /api/blogs Error:", err);
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
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
    console.error("❌ GET /api/blogs Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch blogs" },
      { status: 500 }
    );
  }
}
