import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import clientPromise from "@/lib/mongodb";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// ✅ Supabase Setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ✅ Main POST Handler
export async function POST(req) {
  try {
    const { blogUrl } = await req.json();

    if (!blogUrl) {
      return NextResponse.json({ error: "Missing blogUrl" }, { status: 400 });
    }

    const filename = extractFilename(blogUrl);

    // 🔍 1. Check MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const mongoDoc = await db.collection("blogs").findOne({ blogUrl });

    // 🔍 2. Check Supabase
    const { data: supaData } = await supabase
      .from("summaries")
      .select("*")
      .eq("url", blogUrl)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // ✅ 3. Return if found in both
    if (mongoDoc && supaData) {
      return NextResponse.json({
        title: mongoDoc.blogTitle,
        url: blogUrl,
        text: mongoDoc.blogText,
        summary: supaData.summary,
        translation: supaData.translated,
      });
    }

    // 📂 4. Load from static JSON
    const filePath = path.join(
      process.cwd(),
      "data",
      "static-blogs",
      `${filename}.json`
    );

    const raw = await readFile(filePath, "utf-8");
    const json = JSON.parse(raw);

    // 🧠 5. Generate summary + Urdu
    const summary = generateSummary(json.text);
    const translation = translateToUrdu(summary, json.title);

    // 💾 6. Save to MongoDB (repeat allowed)
    await db.collection("blogs").insertOne({
      blogUrl: json.url,
      blogTitle: json.title,
      blogText: json.text,
      createdAt: new Date(),
    });

    // 💾 7. Save to Supabase (repeat allowed)
    const { error: supaErr } = await supabase.from("summaries").insert({
      url: json.url,
      summary,
      translated: translation,
    });

    if (supaErr) {
      console.error("❌ Supabase insert failed:", supaErr.message);
    } else {
      console.log("✅ Supabase insert success");
    }

    // ✅ 8. Return Response
    return NextResponse.json({
      title: json.title,
      url: json.url,
      text: json.text,
      summary,
      translation,
    });
  } catch (err) {
    console.error("❌ /api/blogdata error:", err.message || err);
    return NextResponse.json(
      { error: "Failed to process blog data" },
      { status: 500 }
    );
  }
}

// 🔧 Helper — normalize URL to filename
function extractFilename(url) {
  return url
    .split("/")
    .pop()
    .replace(".html", "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
