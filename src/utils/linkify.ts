export function linkifyText(text: string, linkClassName?: string): string {
  const urlRegex = /((?:https?:\/\/|www\.)[^\s]+)/g;

  return text.replace(urlRegex, (match) => {

    const cleanUrl = match.replace(/[.,;:!?)]$/, "");
    const trailingPunctuation = match.slice(cleanUrl.length);

    const href = cleanUrl.startsWith("http") ? cleanUrl : `https://${cleanUrl}`;
    const classAttr = linkClassName ? ` class="${linkClassName}"` : "";

    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${classAttr}>${cleanUrl}</a>${trailingPunctuation}`;
  });
}

