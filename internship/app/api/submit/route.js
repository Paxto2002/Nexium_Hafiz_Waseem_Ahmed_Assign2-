export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { scrapeBlogText } from "@/lib/scraper";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { createClient } from "@supabase/supabase-js";

// MongoDB
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;

// Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

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
    const { blogUrl } = await req.json();

    if (!/^https?:\/\//.test(blogUrl)) {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const col = client.db(MONGODB_DB).collection("blogs");

    let blog = await col.findOne({ blogUrl });

    // 🟡 Scrape and insert if not exists
    if (!blog) {
      console.log("📡 Scraping blog:", blogUrl);
      const scraped = await scrapeBlogText(blogUrl);

      console.log("📃 Scraped Content:", scraped?.content?.slice(0, 100));

      if (!scraped || !scraped.content || scraped.content.length < 100) {
        console.error("❌ Scraping failed or content too short:", scraped);
        return NextResponse.json(
          { error: "Scraping failed or content too short." },
          { status: 400 }
        );
      }

      // ✅ Assign scraped blog correctly
      blog = {
        blogUrl,
        blogTitle: scraped.title || "Untitled",
        blogText: scraped.content,
        createdAt: new Date(),
      };

      await col.insertOne(blog);
    }

    // ✅ Generate Summary and Urdu
    const summary = generateSummary(blog.blogText);
    const translated = translateToUrdu(summary);

    // 🟡 Save to Supabase
    const { error: supabaseError } = await supabase.from("summaries").insert({
      blog_url: blogUrl, // match your frontend `.blog_url`
      summary_en: summary,
      summary_ur: translated,
    });

    if (supabaseError) {
      console.error("❌ Supabase insert failed:", supabaseError);
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
