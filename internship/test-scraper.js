import { scrapeBlogText } from "./lib/scraper.js";

const url = "https://nextjs.org/docs/app/getting-started/installation";

scrapeBlogText(url).then((text) => {
  console.log("📄 Extracted Blog Content:\n", text.slice(0, 1000));
});
