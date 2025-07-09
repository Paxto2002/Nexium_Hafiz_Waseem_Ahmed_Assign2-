import { translateToUrdu } from "./lib/translateToUrdu.js";

// 🔍 Add this before or after testPost()
const sampleText = "AI enhances design and helps with user experience.";
console.log("🧠 Urdu:", translateToUrdu(sampleText));

// test-post continues below...
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function testPost() {
  const blogUrl = "https://dev.to/paxto2002/ai-ux-principles-101";
  const blogText =
    "AI UX Principles: Always start with empathy. AI doesn't replace design; it augments it. Here's what you need to know...";

  const translatedText = translateToUrdu(blogText);

  const response = await fetch("http://localhost:3000/api/blogs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      blogUrl,
      blogText: translatedText,
    }),
  });

  const data = await response.json();
  console.log("✅ Result:", data);
}

testPost();
