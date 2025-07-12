"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function SubmitBlogPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Basic client-side check
    if (!url.trim() || !/^https?:\/\//.test(url.trim())) {
      toast.error("🚫 Please enter a valid blog URL starting with http:// or https://");
      return;
    }

    setLoading(true);
    console.log("📤 Submitting blog URL:", url);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blogUrl: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Server response error:", data);
        toast.error(`❌ ${data.error || "Failed to submit blog."}`);
        return;
      }

      toast.success("✅ Blog submitted, summarized, and translated!");
      setUrl(""); // Clear input after success
    } catch (err) {
      console.error("💥 Submission error:", err);
      toast.error("🚨 Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-6 py-12 max-w-2xl mx-auto text-[#0c3baa] dark:text-[#e2e8f0]">
      <section className="text-center space-y-3 mb-10">
        <h1 className="text-4xl font-bold font-short-stack text-[#0c3baa] dark:text-[#facc15]">
          Submit a Blog
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Paste a blog URL below to generate a summary in Urdu.
        </p>
      </section>

      <Card className="bg-[#f4f6f9] dark:bg-[#1e293b] shadow-lg">
        <CardHeader>
          <CardTitle className="text-[#b99400] dark:text-[#facc15] text-lg">
            Blog URL
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="url">Enter Blog URL:</Label>
              <Input
                type="url"
                id="url"
                placeholder="https://example.com/blog-post"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="bg-[#0c3baa] dark:bg-[#facc15] dark:text-black hover:opacity-90 transition w-full"
            >
              {loading ? "⏳ Processing..." : "🧠 Summarise Blog"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
