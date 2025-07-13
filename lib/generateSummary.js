export function generateSummary(blogText) {
  const cleaned = blogText.replace(/\s+/g, " ");
  const sentences = cleaned.split(/[.!?]/).filter((s) => s.length > 20);
  const chosen = sentences.slice(0, 2).join(". ");
  return chosen ? chosen.trim() + "." : "";
}
