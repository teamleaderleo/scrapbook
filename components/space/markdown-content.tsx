"use client";

interface MarkdownContentProps {
  content?: string;
  html?: string; // Pre-rendered HTML from server
  className?: string;
}

export function MarkdownContent({ content, html, className = '' }: MarkdownContentProps) {
  // If pre-rendered HTML is provided, use it directly
  if (html) {
    return (
      <div 
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // Fallback: render empty if no content
  if (!content) {
    return <div className={className}><em>No content</em></div>;
  }

  // This shouldn't happen in normal flow, but just in case
  return <div className={className}>{content}</div>;
}