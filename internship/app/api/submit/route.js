export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { scrapeBlogText } from "@/lib/scraper";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { createClient } from "@supabase/supabase-js";

// Init
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Cached Mongo client
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
      return NextResponse.json({ error: "Invalid blog URL" }, { status: 400 });
    }

    const client = await getMongoClient();
    const col = client.db(MONGODB_DB).collection("blogs");

    let blog = await col.findOne({ blogUrl });

    // 🧠 SCRAPE if not found
    if (!blog) {
      const scraped = await scrapeBlogText(blogUrl);
      if (!scraped) {
        return NextResponse.json({ error: "Scraping failed" }, { status: 500 });
      }

      blog = {
        blogUrl,
        blogTitle: scraped.title || "Untitled",
        blogText: scraped.content,
        createdAt: new Date(),
      };

      await col.insertOne(blog);
    }

    // 🧠 Generate summary + translation
    const summary = generateSummary(blog.blogText);
    const translated = translateToUrdu(summary);

    // 🔁 Check if already in Supabase
    const { data: existing, error: fetchErr } = await supabase
      .from("summaries")
      .select("*")
      .eq("url", blogUrl)
      .single();

    if (!existing) {
      const { error: insertErr } = await supabase.from("summaries").insert({
        url: blogUrl,
        summary,
        translated,
      });

      if (insertErr) {
        console.error("❌ Supabase insert failed:", insertErr);
        return NextResponse.json(
          { error: "Supabase insert failed: " + insertErr.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: "✅ Blog processed",
      summary,
      translated,
    });
  } catch (err) {
    console.error("❌ /api/submit error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
