import React from "react";

interface HighlightTextProps {
  text: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
}

export const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  highlight,
  className = "",
  highlightClassName = "bg-primary/30 text-primary font-semibold rounded px-0.5",
}) => {
  if (!highlight || !highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedHighlight})`, "gi"));

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <mark key={index} className={highlightClassName}>
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </span>
  );
};

export default HighlightText;
