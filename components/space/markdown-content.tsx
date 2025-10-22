"use client";

import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { useEffect, useState } from 'react';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Configure marked options
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown
  breaks: true, // Convert \n to <br>
});

export function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    const parseMarkdown = async () => {
      // Parse markdown to HTML
      const rawHtml = await marked.parse(content);
      
      // Sanitize the HTML
      const cleanHtml = DOMPurify.sanitize(rawHtml, {
        ALLOWED_TAGS: [
          'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
          'a', 'ul', 'ol', 'li', 'blockquote', 'h1', 'h2', 'h3', 
          'h4', 'h5', 'h6', 'table', 'thead', 'tbody', 'tr', 'th', 
          'td', 'img', 'hr', 'div', 'span'
        ],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class'],
        ALLOW_DATA_ATTR: false,
      });
      
      setHtml(cleanHtml);
    };

    parseMarkdown();
  }, [content]);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}