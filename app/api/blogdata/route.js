import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import clientPromise from "@/lib/mongodb";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

// Supabase setup
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function POST(req) {
  try {
    const { blogUrl } = await req.json();

    if (!blogUrl) {
      return NextResponse.json({ error: "Missing blogUrl" }, { status: 400 });
    }

    const filename = extractFilename(blogUrl);

    // Step 1: Check MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const mongoDoc = await db.collection("blogs").findOne({ blogUrl });

    // Step 2: Check Supabase
    const { data: supaData } = await supabase
      .from("summaries")
      .select("*")
      .eq("url", blogUrl)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // ✅ If both found, return from databases
    if (mongoDoc && supaData) {
      return NextResponse.json({
        title: mongoDoc.blogTitle,
        url: blogUrl,
        text: mongoDoc.blogText,
        summary: supaData.summary,
        translation: supaData.translated, // 🟢 correct key from Supabase
      });
    }

    // Step 3: Load static fallback
    const filePath = path.join(
      process.cwd(),
      "data",
      "static-blogs",
      `${filename}.json`
    );
    const raw = await readFile(filePath, "utf-8");
    const json = JSON.parse(raw);

    // Step 4: Generate summary & translation
    const summary = generateSummary(json.text);
    const translation = translateToUrdu(summary, json.title);

    // Step 5: Save to MongoDB (repeat allowed)
    await db.collection("blogs").insertOne({
      blogUrl: json.url,
      blogTitle: json.title,
      blogText: json.text,
      createdAt: new Date(),
    });

    // Step 6: Save to Supabase with correct keys
    const { data: supaInsert, error: supaErr } = await supabase
      .from("summaries")
      .insert({
        url: json.url,
        summary,
        translated: translation, // ✅ Correct column name
      });

    if (supaErr) {
      console.error("❌ Supabase insert failed:", supaErr.message);
    } else {
      console.log("✅ Supabase insert success:", supaInsert);
    }

    // Step 7: Return complete response
    return NextResponse.json({
      title: json.title,
      url: json.url,
      text: json.text,
      summary,
      translation,
    });
  } catch (err) {
    console.error("❌ /api/blogdata error:", err);
    return NextResponse.json(
      { error: "Failed to process blog data" },
      { status: 500 }
    );
  }
}

// 🔧 Extract filename from blog URL
function extractFilename(url) {
  return url
    .split("/")
    .pop()
    .replace(".html", "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}
