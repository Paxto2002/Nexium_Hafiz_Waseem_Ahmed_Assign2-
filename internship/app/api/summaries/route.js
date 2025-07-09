import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(req) {
  try {
    const { blogUrl, blogText } = await req.json();
    if (!blogUrl || !blogText) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const summary = generateSummary(blogText);
    if (!summary) throw new Error("Summary failed");

    const urdu = translateToUrdu(summary);

    const { error } = await supabase.from("summaries").insert({
      url: blogUrl,
      summary: summary,
      translated: urdu,
    });

    if (error) throw error;

    return NextResponse.json({ summary, translated: urdu });
  } catch (err) {
    console.error("❌ /api/summaries POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("summaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err) {
    console.error("❌ GET /api/summaries:", err);
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
