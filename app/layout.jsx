// app/layout.jsx

import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Providers } from "@/app/providers";
import { Short_Stack } from "next/font/google";
import localFont from "next/font/local";

// Google Font: Short Stack
const shortStack = Short_Stack({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-short-stack",
  display: "swap",
});

// Local Font: Urdu Nastaliq
const nastaliqUrdu = localFont({
  src: "./fonts/NotoNastaliqUrdu-VariableFont_wght.ttf",
  variable: "--font-nastaliq",
  display: "swap",
});

export const metadata = {
  title: "BlogTalkhees | AI Urdu Blog Summariser",
  description:
    "BlogTalkhees is an AI-powered summariser that extracts, summarizes, and translates blogs into rich Urdu content.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${shortStack.variable} ${nastaliqUrdu.variable}`}
      suppressHydrationWarning
    >
      <body
        suppressHydrationWarning
        className="font-short-stack antialiased transition-colors duration-300 bg-[#f9fafb] text-[#0f172a] dark:bg-[#26365f] dark:text-[#e2e8f0]"
      >
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
