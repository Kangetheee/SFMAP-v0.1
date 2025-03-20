"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ className, minRows = 1, maxRows = 5, ...props }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const assignedRef = (ref as React.MutableRefObject<HTMLTextAreaElement>) || textareaRef;

  const resizeTextarea = () => {
    const textarea = assignedRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 20;
    const minHeight = minRows * lineHeight;
    const maxHeight = maxRows * lineHeight;
    
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    
    textarea.style.height = `${newHeight}px`;
  };

  useEffect(() => {
    const textarea = assignedRef.current;
    if (!textarea) return;

    // Set initial height
    resizeTextarea();

    // Add event listeners
    textarea.addEventListener("input", resizeTextarea);
    window.addEventListener("resize", resizeTextarea);

    return () => {
      textarea.removeEventListener("input", resizeTextarea);
      window.removeEventListener("resize", resizeTextarea);
    };
  }, [assignedRef]);

  return (
    <textarea
      ref={assignedRef}
      className={cn("resize-none overflow-hidden", className)}
      rows={minRows}
      {...props}
    />
  );
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";
