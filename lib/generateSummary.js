export function generateSummary(blogText) {
  console.log("🔍 incoming:", blogText.slice(0, 500));
  const parts = blogText
    .replace(/\s+/g, " ")
    .split(/[.!?]/)
    .filter((s) => s.length > 20);
  const chosen = parts.slice(0, 2).join(". ");
  return chosen ? chosen.trim() + "." : "";
}
