import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { blogUrl, blogText } = await req.json();

    // 🔒 Validate input
    if (!blogUrl || !blogText) {
      return NextResponse.json(
        { error: "Missing blogUrl or blogText" },
        { status: 400 }
      );
    }

    // 🧠 Generate summary
    const summary = generateSummary(blogText);
    if (!summary) {
      return NextResponse.json(
        { error: "Summary generation failed" },
        { status: 500 }
      );
    }

    // 🌐 Translate to Urdu
    const translated = translateToUrdu(summary);

    // 💾 Insert into Supabase
    const { error } = await supabase.from("summaries").insert({
      url: blogUrl,
      summary,
      translated,
    });

    if (error) {
      throw new Error(`Supabase insert failed: ${error.message}`);
    }

    return NextResponse.json({
      message: "✅ Summary created",
      summary,
      translated,
    });
  } catch (err) {
    console.error("❌ POST /api/summaries error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("summaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(`Supabase fetch error: ${error.message}`);

    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ GET /api/summaries error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
