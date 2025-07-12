"use client";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  const { theme } = useTheme();

  return (
    <footer className="w-full px-6 py-10 mt-12 mb-0 bg-gradient-to-r from-[#d3d8df] to-[#e3e7eb] dark:from-[#0e1625] dark:to-[#0b1120] text-gray-700 dark:text-gray-300 text-sm transition-colors">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-center md:text-left">
        {/* Branding */}
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-[#132C5C] dark:text-[#facc15] font-short-stack">
            BlogTalkhees
          </h2>
          <p className="leading-relaxed">
            BlogTalkhees is an AI-powered Urdu summarizer that scrapes blogs,
            generates concise summaries, and translates them into rich Urdu.
          </p>
        </div>

        {/* Links */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-[#132C5C] dark:text-[#facc15]">
            Quick Links
          </h3>
          <ul className="space-y-1">
            <li>
              <Link
                href="/about"
                className="hover:underline hover:text-[#132C5C] dark:hover:text-[#facc15]"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/privacy"
                className="hover:underline hover:text-[#132C5C] dark:hover:text-[#facc15]"
              >
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link
                href="/terms"
                className="hover:underline hover:text-[#132C5C] dark:hover:text-[#facc15]"
              >
                Terms & Conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Social */}
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-[#132C5C] dark:text-[#facc15]">
            Connect
          </h3>
          <p>Follow me on:</p>
          <div className="flex justify-center md:justify-start space-x-4">
            <a
              href="https://github.com/Paxto2002"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#132C5C] dark:hover:text-[#facc15] transition"
              aria-label="GitHub"
            >
              <Github size={22} />
            </a>
            <a
              href="https://www.linkedin.com/in/hafiz-waseem-ahmed-50a4b2347/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#132C5C] dark:hover:text-[#facc15] transition"
              aria-label="LinkedIn"
            >
              <Linkedin size={22} />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="mt-10 text-center text-xs text-gray-500 dark:text-gray-400 border-t pt-4 border-gray-300 dark:border-zinc-700">
        © {new Date().getFullYear()} BlogTalkhees. All rights reserved.
      </div>
    </footer>
  );
}
