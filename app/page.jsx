"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  return (
    <main className="px-6 py-12 max-w-6xl mx-auto space-y-20 text-[#0f172a] dark:text-[#e2e8f0]">
      {/* Hero Section */}
      <section className="grid md:grid-cols-2 gap-10 items-center">
        <div className="space-y-5 text-center md:text-left">
          <h1 className="text-5xl sm:text-6xl font-bold font-short-stack text-[#0c3baa] dark:text-[#facc15]">
            BlogTalkhees: AI Urdu Blog Summariser
          </h1>
          <p className="font-nastaliq text-2xl text-gray-700 dark:text-gray-300">
            بلاگز کا خلاصہ، اردو میں، ذہانت کے ساتھ۔
          </p>
          <Button asChild size="lg" className="mt-4">
            <Link href="/submit">Submit Blog for Summary</Link>
          </Button>
        </div>
        <div>
          <Image
            src="/Hero.png"
            alt="BlogTalkhees Hero Illustration"
            width={600}
            height={400}
            className="rounded-xl mx-auto"
            priority
          />
        </div>
      </section>

      <Separator className="my-10 border-5 w-screen" />
      
      {/* Features Section */}
      <section className="space-y-6 text-center">
        <h2 className="text-3xl font-semibold text-[#b99400] dark:text-[#facc15]">
          What BlogTalkhees Does
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Scrape Blogs",
              desc: "Extract blog content from URLs using powerful web scraping.",
            },
            {
              title: "AI Summarisation",
              desc: "Summarise content intelligently, keeping only the core ideas.",
            },
            {
              title: "Translate to Urdu",
              desc: "Convert summaries into beautiful, readable Urdu.",
            },
          ].map((f, i) => (
            <Card
              key={i}
              className="bg-[#f4f6f9] dark:bg-[#1e293b] shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <CardHeader>
                <CardTitle className="text-[#b99400] dark:text-[#facc15] text-lg font-bold text-center">
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 dark:text-gray-300 text-center">
                {f.desc}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-[#0c3baa] dark:text-[#facc15]">
          Ready to Try?
        </h2>
        <Button asChild size="lg">
          <Link href="/submit">Submit a Blog Now</Link>
        </Button>
      </section>

      <Separator className="my-10 border-5 w-screen" />

      {/* Creator Footer */}
      <section className="text-center text-sm space-y-1">
        <p className="text-gray-500 dark:text-gray-400">
          Made with 💛 by Hafiz Waseem Ahmed (Paxto)
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Part of Nexium AI-First Web Development Internship — July 2025
        </p>
      </section>
    </main>
  );
}
