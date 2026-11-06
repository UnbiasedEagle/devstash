import { highlightSegments } from "@/lib/search-highlight";

interface HighlightedTextProps {
  text: string;
  words: string[];
}

export default function HighlightedText({ text, words }: HighlightedTextProps) {
  return highlightSegments(text, words).map((segment, index) =>
    segment.match ? (
      <mark
        key={index}
        className="bg-transparent font-semibold text-foreground underline decoration-primary decoration-2 underline-offset-2"
      >
        {segment.text}
      </mark>
    ) : (
      <span key={index}>{segment.text}</span>
    ),
  );
}
