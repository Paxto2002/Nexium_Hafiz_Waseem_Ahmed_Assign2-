export const runtime = "nodejs";

import { MongoClient } from "mongodb";
import { NextResponse } from "next/server";
import { generateSummary } from "@/lib/generateSummary";
import { translateToUrdu } from "@/lib/translateToUrdu";
import { createClient } from "@supabase/supabase-js";
import https from "https";

// ─── Env Setup ─────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const SCRAPER_API_URL = process.env.SCRAPER_API_URL || "http://localhost:5000";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ─── SSL-Fixed HTTPS Agent ──────────────────────────────────
const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
  secureProtocol: "TLSv1_2_method",
  ciphers:
    "ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384",
  honorCipherOrder: true,
  sessionTimeout: 300,
  handshakeTimeout: 10000,
  timeout: 30000,
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxSockets: 5,
  maxFreeSockets: 2,
});

// ─── Mongo Client Cache ─────────────────────────────────────
let cachedClient = null;
async function getMongoClient() {
  if (cachedClient) return cachedClient;
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  cachedClient = client;
  return client;
}

// ─── Enhanced Fetch with SSL Fixes ──────────────────────────
async function robustFetch(url, options = {}) {
  const fetchOptions = {
    ...options,
    agent: httpsAgent,
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; Vercel-Bot/1.0)",
      Accept: "application/json, text/plain, */*",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Cache-Control": "no-cache",
      ...options.headers,
    },
  };

  // Try standard fetch first
  try {
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    console.log(
      `Standard fetch failed: ${error.message}, trying Node.js https...`
    );

    // Fallback to Node.js https module
    return new Promise((resolve, reject) => {
      const postData = options.body || "";
      const urlObj = new URL(url);

      const req = https.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || 443,
          path: urlObj.pathname + urlObj.search,
          method: options.method || "GET",
          headers: {
            ...fetchOptions.headers,
            "Content-Length": Buffer.byteLength(postData),
          },
          agent: httpsAgent,
          timeout: 30000,
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                ok: true,
                status: res.statusCode,
                json: () => Promise.resolve(JSON.parse(data)),
                text: () => Promise.resolve(data),
              });
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
            }
          });
        }
      );

      req.on("error", reject);
      req.on("timeout", () => reject(new Error("Request timeout")));

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }
}

// ─── Scrape Blog Function With SSL Fixes ───────────────────
async function scrapeBlogText(url) {
  if (!url || !/^https?:\/\//.test(url)) {
    throw new Error("Invalid URL format");
  }

  console.log(`🔍 Starting scrape for: ${url}`);

  // Pre-warm the Render service
  try {
    console.log("🔥 Warming up Render service...");
    await robustFetch(SCRAPER_API_URL, {
      method: "GET",
      timeout: 5000,
    });
    console.log("✅ Service warmup successful");
  } catch (warmupError) {
    console.log(
      `⚠️ Warmup failed: ${warmupError.message}, continuing anyway...`
    );
  }

  // Main scraping with retry logic
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`🎯 Scrape attempt ${attempt}/3`);

      const response = await robustFetch(`${SCRAPER_API_URL}/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Scraper failed (${response.status})`);
      }

      const { title, content } = await response.json();

      if (!content || content.length < 100) {
        throw new Error("Scraped content too short or missing");
      }

      console.log(`✅ Scrape successful on attempt ${attempt}`);
      console.log(`📄 Content length: ${content.length}`);
      console.log(`📃 Title: ${title}`);

      return { title, content };
    } catch (err) {
      console.warn(`⚠️ Scrape attempt ${attempt} failed: ${err.message}`);

      if (attempt === 3) {
        throw new Error(
          `All scrape attempts failed. Last error: ${err.message}`
        );
      }

      // Exponential backoff with jitter
      const delay = 1000 * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`⏳ Waiting ${Math.round(delay)}ms before retry...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ─── POST Handler ────────────────────────────────────────────
export async function POST(req) {
  const startTime = Date.now();

  try {
    const { blogUrl } = await req.json();

    if (!/^https?:\/\//.test(blogUrl)) {
      return NextResponse.json({ error: "Invalid blog URL" }, { status: 400 });
    }

    console.log(`🚀 Processing blog: ${blogUrl}`);

    const client = await getMongoClient();
    const col = client.db(MONGODB_DB).collection("blogs");

    // ─── Check MongoDB ──────────────────────────────────────
    let blog = await col.findOne({ blogUrl });

    if (!blog) {
      console.log("📥 Blog not found in MongoDB, scraping...");
      // 🧠 Scrape if not found
      const scraped = await scrapeBlogText(blogUrl);

      blog = {
        blogUrl,
        blogTitle: scraped.title || "Untitled",
        blogText: scraped.content,
        createdAt: new Date(),
      };

      await col.insertOne(blog);
      console.log("💾 Blog saved to MongoDB");
    } else {
      console.log("📋 Blog found in MongoDB cache");
    }

    // 🧠 Generate summary & translation
    console.log("🤖 Generating summary...");
    const summary = generateSummary(blog.blogText);

    console.log("🌐 Translating to Urdu...");
    const translated = translateToUrdu(summary);

    // ─── Save to Supabase if not already ───────────────────
    const { data: existing, error: fetchErr } = await supabase
      .from("summaries")
      .select("*")
      .eq("url", blogUrl)
      .single();

    if (!existing) {
      console.log("💾 Saving to Supabase...");
      const { error: insertErr } = await supabase.from("summaries").insert({
        url: blogUrl,
        summary,
        translated,
      });

      if (insertErr) {
        console.error("❌ Supabase insert failed:", insertErr);
        return NextResponse.json(
          { error: "Supabase insert failed: " + insertErr.message },
          { status: 500 }
        );
      }
    } else {
      console.log("📋 Summary already exists in Supabase");
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Blog processed successfully in ${processingTime}ms`);

    return NextResponse.json({
      message: "✅ Blog processed",
      summary,
      translated,
      processingTime: `${processingTime}ms`,
    });
  } catch (err) {
    const processingTime = Date.now() - startTime;
    console.error(
      `❌ /api/submit error after ${processingTime}ms:`,
      err.message
    );
    console.error("Stack trace:", err.stack);

    return NextResponse.json(
      {
        error: err.message,
        processingTime: `${processingTime}ms`,
      },
      { status: 500 }
    );
  }
}
