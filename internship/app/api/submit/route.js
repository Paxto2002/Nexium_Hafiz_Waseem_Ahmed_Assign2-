export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { scrapeBlogText } from "@/lib/scraper";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { createClient } from "@supabase/supabase-js";

// MongoDB setup
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

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST: Handle everything in one endpoint
export async function POST(req) {
  try {
    const { blogUrl } = await req.json();

    if (!/^https?:\/\//.test(blogUrl)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const col = client.db(MONGODB_DB).collection("blogs");

    // Check if blog already exists
    let blog = await col.findOne({ blogUrl });

    if (!blog) {
      const scraped = await scrapeBlogText(blogUrl);

      if (!scraped || !scraped.content || scraped.content.length < 100) {
        return NextResponse.json(
          { error: "Scraping failed or content too short." },
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

      blog = { blogUrl, blogTitle: title, blogText: content };
    }

    // Generate summary
    const summary = generateSummary(blog.blogText);
    const translated = translateToUrdu(summary);

    // Save to Supabase
    const { error: supabaseError } = await supabase.from("summaries").insert({
      url: blogUrl,
      summary,
      translated,
    });

    if (supabaseError) {
      return NextResponse.json(
        { error: "Supabase insert failed: " + supabaseError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "✅ Full process complete",
      blogText: blog.blogText,
      summary,
      translated,
    });
  } catch (err) {
    console.error("❌ /api/submit error:", {
      message: err.message,
      stack: err.stack,
      full: err,
    });

    return NextResponse.json(
      { error: err.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
