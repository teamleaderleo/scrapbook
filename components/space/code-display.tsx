"use client";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "next-themes";

interface CodeDisplayProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
}

export function CodeDisplay({ 
  code, 
  language = "python", 
  title = "Code",
  className = ""
}: CodeDisplayProps) {
  const { theme } = useTheme();

  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <h3 className="text-sm font-semibold mb-2 text-foreground">{title}</h3>
      <div
        className={`border border-border rounded max-h-96 overflow-auto ${
          theme === 'dark' ? 'bg-card' : 'bg-white'
        }`}
      >
        <SyntaxHighlighter
          language={language}
          style={theme === 'dark' ? vscDarkPlus : oneLight}
          customStyle={{
            margin: 0,
            background: 'transparent',
            padding: '0.75rem',
            fontSize: 14,
            lineHeight: 1.3,
          }}
          codeTagProps={{ style: { background: 'transparent', fontSize: 'inherit' } }}
          PreTag="div"
          className="leading-tight"
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}