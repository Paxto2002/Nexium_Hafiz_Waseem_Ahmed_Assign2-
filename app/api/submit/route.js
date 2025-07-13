import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import clientPromise from "@/lib/mongodb";
import path from "path";
import { readFile } from "fs/promises";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(req) {
  try {
    const { blogUrl } = await req.json();
    const filename = extractFilename(blogUrl);
    const blogPath = path.join(
      process.cwd(),
      "data",
      "static-blogs",
      `${filename}.json`
    );

    // Load static blog JSON
    const raw = await readFile(blogPath, "utf-8");
    const staticData = JSON.parse(raw);

    // Generate summary from text
    const summary = generateSummary(staticData.text);

    // Urdu translation from JS dictionary (based on blog title as topic)
    const translated = translateToUrdu(summary, staticData.title);

    // Save full blog text in MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    await db.collection("blogs").insertOne({
      blogUrl: staticData.url,
      blogTitle: staticData.title,
      blogText: staticData.text,
      createdAt: new Date(),
    });

    // Save summary + translation to Supabase
    await fetch(`${SUPABASE_URL}/rest/v1/summaries`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        blog_url: staticData.url,
        summary_en: summary,
        summary_ur: translated,
      }),
    });

    // Return the full response
    return Response.json({
      ...staticData,
      summary,
      translation: translated,
    });
  } catch (err) {
    console.error("❌ submit error:", err.message);
    return new Response(JSON.stringify({ error: "Processing failed" }), {
      status: 500,
    });
  }
}

function extractFilename(url) {
  return url
    .split("/")
    .pop()
    .replace(".html", "")
    .replace(/[^a-zA-Z0-9-_]/g, "");
}
