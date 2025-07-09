"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export default function AllBlogsPage() {
  const [blogs, setBlogs] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [bRes, sRes] = await Promise.all([
          fetch("/api/blogs"),
          fetch("/api/summaries"),
        ]);

        if (!bRes.ok || !sRes.ok) {
          throw new Error("Fetch failed");
        }

        const blogData = await bRes.json();
        const summaryData = await sRes.json();

        setBlogs(blogData);
        setSummaries(summaryData);
      } catch (err) {
        setError(true);
        toast.error("❌ Failed to load blog/summaries data");
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // 🟡 Match Supabase `blog_url` to MongoDB `blogUrl`
  const findSummary = (url) =>
    summaries.find((s) => s.blog_url === url);

  return (
    <main className="px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#0c3baa] dark:text-[#facc15]">
        📰 All Blogs & Summaries
      </h1>

      {loading ? (
        <p className="text-center">⏳ Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">❌ Could not load blogs.</p>
      ) : blogs.length === 0 ? (
        <p className="text-center">🕸️ No blogs found.</p>
      ) : (
        blogs.map((blog, i) => {
          const summary = findSummary(blog.blogUrl);

          return (
            <Card key={i} className="mb-8 bg-white dark:bg-[#1e293b] shadow">
              <CardHeader>
                <CardTitle className="text-[#0c3baa] dark:text-[#facc15]">
                  {blog.blogTitle}
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Submitted: {new Date(blog.createdAt).toLocaleString()}
                </p>
                <a
                  href={blog.blogUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-500 underline"
                >
                  {blog.blogUrl}
                </a>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-md text-[#b99400]">
                    📄 Full Blog Text:
                  </h3>
                  <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                    {blog.blogText.length > 700
                      ? blog.blogText.slice(0, 700) + "..."
                      : blog.blogText}
                  </p>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold text-md text-[#b99400]">
                    🧠 Summary:
                  </h3>
                  <p className="text-sm">
                    {summary?.summary_en ?? "❌ No summary available"}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-md text-[#b99400]">
                    🌐 Urdu Translation:
                  </h3>
                  <p className="text-sm">
                    {summary?.summary_ur ?? "❌ No translation available"}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </main>
  );
}
