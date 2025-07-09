// test-summary.js

import { generateSummary } from "./lib/generateSummary.js";

// Sample blog text
const blogText = `
Next.js 15 introduces powerful new features for performance and routing.
It now includes partial prerendering and improved caching.
These updates are designed to reduce load times and increase interactivity.
Developers will notice better error overlays and improved DX overall.
`;

const summary = generateSummary(blogText);
console.log("🧠 Summary:\n", summary);
