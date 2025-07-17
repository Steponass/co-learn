// src/components/SafeLinkifiedText.tsx
import { useMemo } from "react";
import { linkifyText } from "@/utils/linkify";

interface SafeLinkifiedTextProps {
  text: string;
  linkClassName?: string;
}

export function SafeLinkifiedText({
  text,
  linkClassName,
}: SafeLinkifiedTextProps) {
  const linkifiedText = useMemo(() => {
    // Basic XSS protection: escape HTML entities first
    const escapedText = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    // Use the improved linkifyText utility
    return linkifyText(escapedText, linkClassName);
  }, [text, linkClassName]);

  return <span dangerouslySetInnerHTML={{ __html: linkifiedText }} />;
}
