import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { createClient } from "@supabase/supabase-js";

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
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

export async function GET() {
  try {
    const client = await getMongoClient();
    const blogs = await client
      .db(MONGODB_DB)
      .collection("blogs")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    const { data: summaries } = await supabase.from("summaries").select("*");

    const enriched = blogs.map((blog) => {
      const match = summaries.find((s) => s.url === blog.blogUrl);
      return {
        ...blog,
        summary_en: match?.summary ?? null,
        summary_ur: match?.translated ?? null,
      };
    });

    return NextResponse.json(enriched);
  } catch (err) {
    console.error("❌ /api/all error:", err.message);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
