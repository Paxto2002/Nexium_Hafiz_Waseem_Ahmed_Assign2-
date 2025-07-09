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
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/all");
        if (!res.ok) throw new Error("Failed to fetch /api/all");

        const data = await res.json();
        setEntries(data);
      } catch (err) {
        setError(true);
        toast.error("❌ Failed to load blog data");
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <main className="px-6 py-12 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-[#0c3baa] dark:text-[#facc15]">
        📰 All Blogs & Summaries
      </h1>

      {loading ? (
        <p className="text-center">⏳ Loading...</p>
      ) : error ? (
        <p className="text-center text-red-500">❌ Could not load blogs.</p>
      ) : entries.length === 0 ? (
        <p className="text-center">🕸️ No blogs found.</p>
      ) : (
        entries.map((entry, i) => (
          <Card key={i} className="mb-8 bg-white dark:bg-[#1e293b] shadow">
            <CardHeader>
              <CardTitle className="text-[#0c3baa] dark:text-[#facc15]">
                {entry.blogTitle}
              </CardTitle>
              <p className="text-xs text-gray-500">
                Submitted: {new Date(entry.createdAt).toLocaleString()}
              </p>
              <a
                href={entry.blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-500 underline"
              >
                {entry.blogUrl}
              </a>
            </CardHeader>

            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-md text-[#b99400]">
                  📄 Full Blog Text:
                </h3>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {entry.blogText.length > 700
                    ? entry.blogText.slice(0, 700) + "..."
                    : entry.blogText}
                </p>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold text-md text-[#b99400]">
                  🧠 Summary:
                </h3>
                <p className="text-sm">
                  {entry.summary_en ?? "❌ No summary available"}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-md text-[#b99400]">
                  🌐 Urdu Translation:
                </h3>
                <p className="text-sm">
                  {entry.summary_ur ?? "❌ No translation available"}
                </p>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
