export const runtime = "nodejs";

import { NextResponse } from "next/server";

const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

export async function POST(req) {
  try {
    const { url } = await req.json();

    if (!url || !/^https?:\/\//.test(url)) {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    const apiUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(
      url
    )}&render=true`;

    const res = await fetch(apiUrl);
    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch from ScraperAPI" },
        { status: 500 }
      );
    }

    const html = await res.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

    const title = titleMatch ? titleMatch[1] : "Untitled";
    const content = bodyMatch
      ? bodyMatch[1].replace(/<[^>]+>/g, "").slice(0, 2000)
      : "";

    if (!content || content.length < 100) {
      return NextResponse.json(
        { error: "Content too short or not found" },
        { status: 422 }
      );
    }

    return NextResponse.json({ title, content });
  } catch (err) {
    console.error("ScraperAPI error:", err.message);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
