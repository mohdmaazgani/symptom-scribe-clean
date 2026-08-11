import { useState, useEffect, useRef } from "react";

export function useTypewriter(text: string, speed: number = 25, enabled: boolean = true) {
  const cleanedText = text
    .replace(/READY_FOR_ANALYSIS\s*\{[\s\S]*?\}[ \t]*/g, "")
    .replace(/READY_FOR_ANALYSIS([\s\S]*)$/g, "");

  const [displayedText, setDisplayedText] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  const cleanedTextRef = useRef(cleanedText);
  const displayedTextRef = useRef("");
  const isFinishedRef = useRef(false);
  const currentTokenIndexRef = useRef(0);

  // Keep cleanedTextRef up to date
  useEffect(() => {
    cleanedTextRef.current = cleanedText;
  }, [cleanedText]);

  // Check for continuation and reset if needed
  useEffect(() => {
    if (!enabled) return;

    const isContinuation = displayedTextRef.current && cleanedText.startsWith(displayedTextRef.current);
    if (!isContinuation) {
      setDisplayedText("");
      displayedTextRef.current = "";
      currentTokenIndexRef.current = 0;
      setIsFinished(false);
      isFinishedRef.current = false;
    } else if (cleanedText.length > displayedTextRef.current.length) {
      // It is a continuation but target text has grown, so we are not finished typing yet
      setIsFinished(false);
      isFinishedRef.current = false;
    }
  }, [cleanedText, enabled]);

  useEffect(() => {
    if (!enabled) {
      setDisplayedText(cleanedText);
      setIsFinished(true);
      displayedTextRef.current = cleanedText;
      isFinishedRef.current = true;
      return;
    }

    if (!cleanedText) {
      setDisplayedText("");
      setIsFinished(true);
      displayedTextRef.current = "";
      isFinishedRef.current = true;
      return;
    }

    const interval = setInterval(() => {
      const target = cleanedTextRef.current;
      const tokens = target.split(/(\s+)/);
      const currentIndex = currentTokenIndexRef.current;

      if (currentIndex >= tokens.length) {
        // Caught up and typed all tokens
        if (!isFinishedRef.current) {
          setIsFinished(true);
          isFinishedRef.current = true;
        }
        return;
      }

      // We are behind the target tokens. Type next token.
      setIsFinished(false);
      isFinishedRef.current = false;

      // To prevent typing lag if we fall far behind, we can catch up by typing multiple tokens.
      // E.g., if we are more than 6 tokens behind, we type 3 tokens per tick instead of 1.
      const tokensBehind = tokens.length - currentIndex;
      const tokensToAppend = tokensBehind > 6 ? 3 : 1;

      const nextIndex = Math.min(currentIndex + tokensToAppend, tokens.length);
      const nextText = tokens.slice(0, nextIndex).join("");

      currentTokenIndexRef.current = nextIndex;
      displayedTextRef.current = nextText;
      setDisplayedText(nextText);

      if (nextIndex >= tokens.length) {
        setIsFinished(true);
        isFinishedRef.current = true;
      }
    }, speed);

    return () => clearInterval(interval);
  }, [enabled, speed]);

  const skip = () => {
    const target = cleanedTextRef.current;
    const tokens = target.split(/(\s+)/);
    setDisplayedText(target);
    setIsFinished(true);
    displayedTextRef.current = target;
    isFinishedRef.current = true;
    currentTokenIndexRef.current = tokens.length;
  };

  return { displayedText, isFinished, skip };
}
