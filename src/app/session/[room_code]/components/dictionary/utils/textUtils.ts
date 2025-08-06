export const stripHtml = (html: string): string => {
  // Handle Merriam-Webster specific markup
  const cleaned = html
    .replace(/\{bc\}/g, "")
    .replace(/\{it\}([^}]+)\{\/it\}/g, "$1")
    .replace(/\{phrase\}([^}]+)\{\/phrase\}/g, "$1")
    .replace(/\{dx\}[^{]*\{dxt\|([^|]+)\|\|\}\{\/dx\}/g, "(opposite: $1)")
    .replace(/\{sx\|([^|]+)\|\|\}/g, "($1)")
    .replace(/\{d_link\|([^|]+)\|([^}]+)\}/g, "$1")
    .replace(/\{sub\}([^}]+)\{\/sub\}/g, "$1")
    .replace(/\{sup\}([^}]+)\{\/sup\}/g, "$1")
    .replace(/\{b\}([^}]+)\{\/b\}/g, "$1")
    .replace(/\{sc\}([^}]+)\{\/sc\}/g, "$1")
    .replace(/\{lat\}([^}]+)\{\/lat\}/g, "$1")
    .replace(/\{foreign\}([^}]+)\{\/foreign\}/g, "$1")
    .replace(/\{[^}]*\}/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // Try to use DOMParser for any remaining HTML entities, fallback to cleaned string
  try {
    const doc = new DOMParser().parseFromString(cleaned, "text/html");
    return doc.body.textContent || cleaned;
  } catch {
    return cleaned;
  }
};

/*
 * Extracts synonyms from Merriam-Webster formatted text
 */
export const extractSynonyms = (text: string): string[] => {
  const synonyms: string[] = [];

  const synonymRegex1 = /\[=\{it\}([^}]+)\{\/it\}\]/g;
  let match;
  while ((match = synonymRegex1.exec(text)) !== null) {
    synonyms.push(match[1]);
  }

  return synonyms;
};
