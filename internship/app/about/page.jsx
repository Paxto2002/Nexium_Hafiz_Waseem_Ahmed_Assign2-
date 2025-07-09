"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const About = () => {
  return (
    <main className="px-6 py-12 max-w-6xl mx-auto space-y-16 text-[#0c3baa] dark:text-[#e2e8f0]">
      
      {/* Page Title */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold font-short-stack relative inline-block">
          <span className="text-[#0c3baa] dark:text-[#facc15]">
            About BlogTalkhees
          </span>
          <span className="block h-1 w-20 bg-[#b99400] dark:bg-[#facc15] mx-auto mt-3 rounded-full animate-pulse" />
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          <span className="block font-nastaliq text-2xl leading-relaxed italic text-[#132c5c] dark:text-[#e0e0e0]">
            بلاگ تلخیص ایک ذہین اردو خلاصہ ساز ہے جو ویب بلاگز کو سمجھنے میں آپ کی مدد کرتا ہے۔
          </span>
        </p>
      </section>

      {/* Overview Section */}
      <section className="space-y-6 text-center md:text-left">
        <h2 className="text-2xl font-semibold text-[#b99400] dark:text-[#facc15] tracking-wide uppercase">
          Our Mission
        </h2>
        <p className="leading-loose text-gray-700 dark:text-gray-300 text-base sm:text-lg">
          <span className="font-medium text-[#0c3baa] dark:text-[#e2e8f0]">
            BlogTalkhees
          </span>{" "}
          aims to make online content more accessible for Urdu-speaking audiences. We help users
          extract blog content, generate summaries using intelligent logic, and then translate them into rich,
          readable Urdu. Whether you're a student, researcher, or curious reader — we help you save time and
          understand more in your native language.
        </p>
      </section>

      {/* Features Summary with Cards */}
      <section className="grid gap-8 md:grid-cols-3">
        {[
          {
            title: "Scrape Blogs",
            description: "Extract blog data from URLs using web scraping tools.",
          },
          {
            title: "Summarise Content",
            description: "Use intelligent summarisation to keep key points only.",
          },
          {
            title: "Translate to Urdu",
            description: "Convert summaries into elegant Urdu with our custom logic.",
          },
        ].map((feature, index) => (
          <Card
            key={index}
            className="bg-[#f4f6f9] dark:bg-[#1e293b] shadow-md hover:shadow-xl hover:ring-2 hover:ring-[#b99400] dark:hover:ring-[#facc15] hover:-translate-y-1 transition-all duration-300 border border-transparent"
          >
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-[#b99400] dark:text-[#facc15] text-lg font-bold">
                {feature.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700 dark:text-gray-300 text-center leading-relaxed">
              {feature.description}
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Creator Section */}
      <section className="mt-16 text-center space-y-3">
        <p className="text-sm text-[#3d78d7] dark:text-gray-400">
          Made with 💙 by <span className="font-semibold">Hafiz Waseem Ahmed (Paxto)</span>
        </p>
        <p className="text-xs text-gray-700 dark:text-gray-500 italic">
          Part of Nexium AI-First Web Development Internship — July 2025
        </p>
      </section>
    </main>
  );
};

export default About;
