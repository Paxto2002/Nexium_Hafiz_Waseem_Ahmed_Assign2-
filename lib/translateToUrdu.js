import { urduDictionary } from "./urduDictionary";

export function translateToUrdu(text) {
  return text
    .split(/\s+/)
    .map((w) => {
      const m = w.match(/^([A-Za-z]+)([.,!?]*)$/);
      if (!m) return w;
      const t = urduDictionary[m[1].toLowerCase()] || m[1];
      return t + m[2];
    })
    .join(" ");
}
