"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useTheme } from "next-themes";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Submit Blog", href: "/submit" },
];

  return (
    <header className="w-full px-4 py-3 bg-gradient-to-r from-[#e8edf3] to-[#f6f8fa] dark:from-[#0e1625] dark:to-[#0b1120] shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center text-gray-800 dark:text-white">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/BlogTalkhees_Logo.png"
            alt="BlogTalkhees Logo"
            width={80}
            height={80}
            className="object-contain"
            priority
            unoptimized
          />
          <span className="text-2xl md:text-3xl font-bold tracking-wide font-short-stack">
            BlogTalkhees
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-4 text-[16px] font-medium">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="hover:text-[#1e293b] transition hover:bg-[#facc15] py-2 px-4 rounded-3xl text-center"
            >
              {link.name}
            </Link>
          ))}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-4 p-2 rounded-full hover:text-[#1e293b] hover:bg-[#facc15] dark:hover:bg-[#facc15] transition"
            aria-label="Toggle theme"
          >
            {mounted &&
              (theme === "dark" ? <Sun size={20} /> : <Moon size={20} />)}
          </button>
        </nav>

        {/* Mobile Nav Toggle */}
        <div className="md:hidden flex items-center space-x-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-gray-300 dark:hover:bg-zinc-700 transition"
            aria-label="Toggle theme"
          >
            {mounted &&
              (theme === "dark" ? <Sun size={20} /> : <Moon size={20} />)}
          </button>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded hover:bg-gray-300 dark:hover:bg-zinc-800 transition"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden mt-2 space-y-2 px-4 pb-4 text-sm font-medium text-gray-700 dark:text-gray-200 flex flex-col items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="block text-[#1e293b] bg-[#facc15] py-2 px-6 rounded-3xl w-[90%] text-center"
              onClick={() => setMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
