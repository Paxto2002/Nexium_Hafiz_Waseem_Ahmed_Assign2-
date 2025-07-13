"use client";

import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";

export default function SubmitBlogPage() {
  const [url, setUrl] = useState("");
  const [selectedBlogData, setSelectedBlogData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [allBlogs, setAllBlogs] = useState([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load blog options from static list
  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const res = await fetch("/api/all");
        if (!res.ok) throw new Error("Failed to load blogs");
        const data = await res.json();

        const seen = new Set();
        const unique = data.filter((b) => {
          if (seen.has(b.url)) return false;
          seen.add(b.url);
          return true;
        });

        setAllBlogs(unique);
      } catch (err) {
        console.error("❌ Blog fetch error:", err);
        toast.error("❌ Failed to load blog list.");
      } finally {
        setLoadingBlogs(false);
      }
    };
    fetchBlogs();
  }, []);

  // Load blog from MongoDB/Supabase when selected
  const handleSelect = async (val) => {
    setUrl(val);
    setSelectedBlogData(null);
    setNotFound(false);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/blogdata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogUrl: val }),
      });

      if (!res.ok) {
        setNotFound(true);
        toast.error("❌ Blog not found.");
        return;
      }

      const data = await res.json();
      setSelectedBlogData(data);
      setSaveSuccess(true);
      toast.success("✅ Saved: Full text → MongoDB | Summary + Urdu → Supabase");

      // Reset animation after delay
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error("❌ API Error:", err);
      toast.error("Server error.");
    }
  };

  return (
    <main className="px-6 py-12 max-w-2xl mx-auto text-[#0c3baa] dark:text-[#e2e8f0]">
      <section className="text-center space-y-3 mb-10">
        <h1 className="text-4xl font-bold font-short-stack text-[#0c3baa] dark:text-[#facc15]">
          View Blog Summary
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Choose a blog to preview its full content, summary, and Urdu translation.
        </p>
      </section>

      <Card className="bg-[#f4f6f9] dark:bg-[#1e293b] shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#b99400] dark:text-[#facc15] text-lg">
            Select Blog
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select onValueChange={handleSelect}>
            <SelectTrigger className="w-full bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-700 text-sm">
              <SelectValue placeholder="👇 Choose a blog..." />
            </SelectTrigger>
            <SelectContent>
              {allBlogs.map((blog) => (
                <SelectItem key={blog.url} value={blog.url}>
                  <div>
                    <p className="font-medium">{blog.title}</p>
                    <p className="text-xs text-muted-foreground">{blog.url}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-green-600 dark:text-green-400 font-semibold text-sm text-center">
                  ✅ Full text saved to MongoDB & summary+translation saved to Supabase!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {selectedBlogData && (
        <Card className="mt-10 bg-white dark:bg-[#1e293b] shadow-md">
          <CardHeader>
            <CardTitle className="text-[#0c3baa] dark:text-[#facc15]">
              {selectedBlogData.title}
            </CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">{selectedBlogData.url}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold text-md text-[#b99400]">📄 Full Blog Text:</h3>
              <p className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-200">
                {selectedBlogData.text}
              </p>
            </div>
            <Separator />
            <div>
              <h3 className="font-semibold text-md text-[#b99400]">🧠 Summary:</h3>
              <p className="text-sm">{selectedBlogData.summary}</p>
            </div>
            <div>
              <h3 className="font-semibold text-md text-[#b99400]">🌐 Urdu Translation:</h3>
              <p className="text-sm font-nastaliq">{selectedBlogData.translation}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {notFound && (
        <Card className="mt-10 bg-white dark:bg-[#1e293b] border border-red-500">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">
              🚫 Blog Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">
              This blog was not found in databases or local files.
            </p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
