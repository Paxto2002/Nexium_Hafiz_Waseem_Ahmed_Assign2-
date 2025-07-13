import { urduDictionary } from "./urduDictionary";

// Fuzzy match helper
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]/g, " ")
    .trim()
    .replace(/\s+/g, "_");
}

export function translateToUrdu(summary, topic = "") {
  const normalizedTopic = normalize(topic);

  // Exact match
  if (urduDictionary[normalizedTopic]?.translated) {
    return urduDictionary[normalizedTopic].translated;
  }

  // Fuzzy partial match
  const matchedKey = Object.keys(urduDictionary).find((key) =>
    normalizedTopic.includes(key)
  );

  if (matchedKey) {
    return urduDictionary[matchedKey].translated;
  }

  // No match — fallback
  return summary;
}
