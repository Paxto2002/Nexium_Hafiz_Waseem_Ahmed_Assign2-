export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { createClient } from "@supabase/supabase-js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const SCRAPER_API_URL = process.env.NEXT_PUBLIC_SCRAPER_API_URL;

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

async function scrapeBlogText(url) {
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error("Invalid URL format");
  }

  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(SCRAPER_API_URL, {
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

export async function POST(req) {
  try {
    const body = await req.json();
    const finalUrl = body.url || body.blogUrl;

    if (!/^https?:\/\//.test(finalUrl)) {
      return NextResponse.json({ error: "Invalid blog URL" }, { status: 400 });
    }

    const client = await getMongoClient();
    const col = client.db(MONGODB_DB).collection("blogs");

    let blog = await col.findOne({ blogUrl: finalUrl });

    if (!blog) {
      const scraped = await scrapeBlogText(finalUrl);
      blog = {
        blogUrl: finalUrl,
        blogTitle: scraped.title || "Untitled",
        blogText: scraped.content,
        createdAt: new Date(),
      };
      await col.insertOne(blog);
    }

    const summary = generateSummary(blog.blogText);
    const translated = translateToUrdu(summary);

    const { data: existing } = await supabase
      .from("summaries")
      .select("*")
      .eq("url", finalUrl)
      .single();

    if (!existing) {
      const { error: insertErr } = await supabase.from("summaries").insert({
        url: finalUrl,
        summary,
        translated,
      });

      if (insertErr) {
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
