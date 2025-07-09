import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { Short_Stack } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";

// English Font: Short Stack
const shortStack = Short_Stack({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-short-stack",
});

// Urdu Font: Local Nastaliq
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
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1e293b" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon-16x16.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>

      <body className="font-short-stack antialiased transition-colors duration-300 bg-[#f9fafb] text-[#0f172a] dark:bg-[#26365f] dark:text-[#e2e8f0]">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={true}
          disableTransitionOnChange={false}
        >
          {/* Full height layout wrapper */}
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
