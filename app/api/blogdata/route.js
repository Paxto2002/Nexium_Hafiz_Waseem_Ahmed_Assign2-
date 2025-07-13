import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import clientPromise from "@/lib/mongodb";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req) {
  try {
    const { blogUrl } = await req.json();
    if (!blogUrl)
      return NextResponse.json({ error: "Missing blogUrl" }, { status: 400 });

    const filename = extractFilename(blogUrl);

    // MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const mongoDoc = await db.collection("blogs").findOne({ blogUrl });

    // Supabase
    const { data: supaData } = await supabase
      .from("summaries")
      .select("*")
      .eq("url", blogUrl)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (mongoDoc && supaData) {
      return NextResponse.json({
        title: mongoDoc.blogTitle,
        url: blogUrl,
        text: mongoDoc.blogText,
        summary: supaData.summary,
        translation: supaData.translated,
      });
    }

    // Static JSON from public folder (via fetch)
    const fileUrl = `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://blogtalkhees.vercel.app"
    }/static-blogs/${filename}.json`;
    const res = await fetch(fileUrl);
    if (!res.ok) throw new Error("Static blog JSON not found");
    const json = await res.json();

    const summary = generateSummary(json.text);
    const translation = translateToUrdu(summary, json.title);

    await db.collection("blogs").insertOne({
      blogUrl: json.url,
      blogTitle: json.title,
      blogText: json.text,
      createdAt: new Date(),
    });

    await supabase.from("summaries").insert({
      url: json.url,
      summary,
      translated: translation,
    });

    return NextResponse.json({
      title: json.title,
      url: json.url,
      text: json.text,
      summary,
      translation,
    });
  } catch (err) {
    console.error("❌ /api/blogdata error:", err.message);
    return NextResponse.json({ error: "Blog load failed" }, { status: 500 });
  }
}

function extractFilename(url) {
  return url
    .split("/")
    .pop()
    .replace(".html", "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
