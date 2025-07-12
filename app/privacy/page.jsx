"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const PrivacyPolicy = () => {
  return (
    <main className="px-6 py-12 max-w-5xl mx-auto space-y-10 text-[#0f172a] dark:text-[#e2e8f0]">
      {/* Page Title */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl sm:text-5xl font-bold font-short-stack text-[#0c3baa] dark:text-[#facc15]">
          Privacy Policy
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Learn how BlogTalkhees collects, uses, and protects your data.
        </p>
      </section>

      {/* Main Card */}
      <Card className="p-6 md:p-8 bg-[#f4f6f9] dark:bg-[#1e293b] border border-gray-200 dark:border-zinc-700 shadow-md space-y-8 text-sm leading-relaxed text-gray-800 dark:text-gray-200">
        {[
          {
            title: "1. Information We Collect",
            body: `BlogTalkhees does not collect any personally identifiable information from users.
We only store blog URLs and their summaries for display and learning purposes. No user accounts, cookies, or tracking systems are used.`,
          },
          {
            title: "2. How We Use Your Data",
            body: `All blog data is used solely to demonstrate the summarization and Urdu translation features of the platform.
We do not sell, share, or misuse any content provided by the user.`,
          },
          {
            title: "3. Data Storage",
            body: `Blog data is temporarily stored in our database services (Supabase & MongoDB) strictly for functional purposes.
You can request removal of any data by contacting us.`,
          },
          {
            title: "4. Third-Party Services",
            body: `We use Supabase and MongoDB Atlas for storing summaries and full blog content. These services follow secure data handling practices, but BlogTalkhees is not responsible for their internal policies.`,
          },
          {
            title: "5. Changes to Policy",
            body: `We may update this Privacy Policy from time to time to reflect changes in features or legal requirements.
We encourage you to review this page periodically.`,
          },
          {
            title: "6. Contact Us",
            body: `If you have any questions about this Privacy Policy or would like to request data removal, feel free to reach out via GitHub or LinkedIn.`,
          },
        ].map((section, index) => (
          <div key={index} className="space-y-3">
            <h2 className="text-lg font-semibold text-[#b99400] dark:text-[#facc15] tracking-wide">
              {section.title}
            </h2>
            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
              {section.body}
            </p>
            {index !== 5 && <Separator className="my-4 dark:bg-zinc-600" />}
          </div>
        ))}
      </Card>

      {/* Footer Note */}
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-8">
        Last updated: July 14, 2025
      </p>
    </main>
  );
};

export default PrivacyPolicy;
