import fs from "fs/promises";
import path from "path";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const blogDir = path.join(process.cwd(), "public", "static-blogs");
    const files = await fs.readdir(blogDir);

    const blogs = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(blogDir, filename);
        const raw = await fs.readFile(filePath, "utf-8");
        const json = JSON.parse(raw);

        const summary = json.summary || "No summary available";
        const translation = translateToUrdu(summary, json.title);

        return {
          url: json.url || `missing-url-${filename}`,
          title: json.title || "Untitled",
          text: json.text || "",
          summary,
          translation,
        };
      })
    );

    return NextResponse.json(blogs);
  } catch (err) {
    console.error("❌ Error reading static blogs:", err.message);
    return NextResponse.json(
      { error: "Failed to load blogs" },
      { status: 500 }
    );
  }
}
