"use client";

import { useEffect } from "react";

export default function TestPage() {
  useEffect(() => {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      url: "https://vercel.com/blog/nextjs-15-release",
      summary:
        "Next.js 15 introduces powerful routing and streaming improvements.",
      translated:
        "Next.js 15 میں طاقتور روٹنگ اور اسٹریمنگ میں بہتریاں متعارف کرائی گئی ہیں۔",
    });

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };

    fetch("http://localhost:3000/api/summaries", requestOptions)
      .then((response) => response.json())
      .then((result) => console.log("✅ POST Success:", result))
      .catch((error) => console.error("❌ POST Error:", error));
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Test Summary Submission</h1>
        <p>Check your browser console (F12) for the result.</p>
      </div>
    </main>
  );
}
