import { useEffect, useState } from "react";

interface MessageStreamingProps {
  content: string;
  isStreaming?: boolean;
  onComplete?: () => void;
}

export function MessageStreaming({
  content,
  isStreaming = false,
  onComplete,
}: MessageStreamingProps) {
  const [displayedContent, setDisplayedContent] = useState("");

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      onComplete?.();
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (index < content.length) {
        setDisplayedContent(content.substring(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, 10);

    return () => clearInterval(interval);
  }, [content, isStreaming, onComplete]);

  return (
    <div className="text-sm leading-relaxed">
      {displayedContent}
      {isStreaming && displayedContent.length < content.length && (
        <span className="animate-pulse">▌</span>
      )}
    </div>
  );
}

