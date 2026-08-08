import { useState, useEffect, useRef } from "react";

export function useTypewriter(text: string, speed: number = 25, enabled: boolean = true) {
  const cleanedText = text
    .replace(/READY_FOR_ANALYSIS\s*\{.*?\}[ \t]*/g, "")
    .replace(/READY_FOR_ANALYSIS(\s*\{.*)?$/g, "");
  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const prevTextRef = useRef("");

  useEffect(() => {
    if (!enabled || !cleanedText) {
      setDisplayedText(cleanedText);
      setIsFinished(true);
      prevTextRef.current = cleanedText;
      return;
    }

    // SSE/Streaming check: If the new text is an extension of the previous text
    // (i.e. it starts with the previous text and is longer), it means we are actively streaming.
    // In this case, we immediately catch up to display the new text chunk without delay.
    const isStreaming = prevTextRef.current && cleanedText.startsWith(prevTextRef.current) && cleanedText !== prevTextRef.current;
    if (isStreaming) {
      setDisplayedText(cleanedText);
      setIsFinished(true);
      prevTextRef.current = cleanedText;
      return;
    }

    // Otherwise, we treat it as a new static string (e.g. from history or static responses)
    // and trigger the typewriter/progressive reveal effect.
    prevTextRef.current = cleanedText;
    setIsFinished(false);

    // Split text into tokens (words and whitespaces)
    const tokens = cleanedText.split(/(\s+)/);
    let currentIndex = 0;
    setDisplayedText("");

    const interval = setInterval(() => {
      if (currentIndex >= tokens.length) {
        setDisplayedText(cleanedText);
        setIsFinished(true);
        clearInterval(interval);
        return;
      }

      const nextToken = tokens[currentIndex];
      setDisplayedText((prev) => prev + nextToken);
      
      if (currentIndex === tokens.length - 1) {
        setIsFinished(true);
        clearInterval(interval);
      }

      currentIndex++;
    }, speed);

    return () => clearInterval(interval);
  }, [cleanedText, speed, enabled]);

  const skip = () => {
    setDisplayedText(cleanedText);
    setIsFinished(true);
  };

  return { displayedText, isFinished, skip };
}
