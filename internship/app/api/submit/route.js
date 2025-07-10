export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { createClient } from "@supabase/supabase-js";

// ─── Env Setup ─────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://localhost:5000";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── Mongo Client Cache ─────────────────────────────────────
let cachedClient = null;
async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

// ─── Scrape Blog Function With Retry ────────────────────────
async function scrapeBlogText(url) {
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error("Invalid URL format");
  }

  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`${SCRAPER_API_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Scraper failed (${res.status})`);
      }

      const { title, content } = await res.json();

      if (!content || content.length < 100) {
        throw new Error("Scraped content too short or missing");
      }

      return { title, content };
    } catch (err) {
      console.warn(`⚠️ Scrape attempt ${i + 1} failed: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw new Error("All scrape attempts failed");
}

// ─── POST Handler ────────────────────────────────────────────
export async function POST(req) {
  try {
    const { blogUrl } = await req.json();

    if (!/^https?:\/\//.test(blogUrl)) {
      return NextResponse.json({ error: "Invalid blog URL" }, { status: 400 });
    }

    const client = await getMongoClient();
    const col = client.db(MONGODB_DB).collection("blogs");

    // ─── Check MongoDB ──────────────────────────────────────
    let blog = await col.findOne({ blogUrl });

    if (!blog) {
      // 🧠 Scrape if not found
      const scraped = await scrapeBlogText(blogUrl);

      blog = {
        blogUrl,
        blogTitle: scraped.title || "Untitled",
        blogText: scraped.content,
        createdAt: new Date(),
      };

      await col.insertOne(blog);
    }

    // 🧠 Generate summary & translation
    const summary = generateSummary(blog.blogText);
    const translated = translateToUrdu(summary);

    // ─── Save to Supabase if not already ───────────────────
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
    console.error("❌ /api/submit error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
