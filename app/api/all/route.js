import fs from "fs/promises";
import path from "path";
import { translateToUrdu } from "@/lib/translateToUrdu"; // ✅ import it

export async function GET() {
  try {
    const blogDir = path.join(process.cwd(), "data", "static-blogs");
    const files = await fs.readdir(blogDir);

    const blogs = await Promise.all(
      files.map(async (filename) => {
        const filePath = path.join(blogDir, filename);
        const raw = await fs.readFile(filePath, "utf-8");
        const json = JSON.parse(raw);

        // Generate Urdu translation based on blog title
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

    return Response.json(blogs);
  } catch (err) {
    console.error("❌ Error reading static blogs:", err.message);
    return new Response(JSON.stringify({ error: "Failed to load blogs" }), {
      status: 500,
    });
  }
}
