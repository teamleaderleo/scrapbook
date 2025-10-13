"use client";
import { useRef } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from "next-themes";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
}

export function CodeEditor({ 
  value, 
  onChange, 
  language = "python",
  placeholder = "function solution() {\n  // code\n}"
}: CodeEditorProps) {
  const { theme } = useTheme();
  const highlightRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      <h2 className="text-sm font-semibold mb-2 text-foreground">Code</h2>
      <div className={`relative border border-border rounded h-96 overflow-hidden ${
        theme === 'dark' ? 'bg-card' : 'bg-white'
      }`}>
        {/* Syntax highlighted background */}
        <div 
          ref={highlightRef}
          className="absolute inset-0 overflow-auto pointer-events-none"
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
            {value || ' '}
          </SyntaxHighlighter>
        </div>
        
        {/* Transparent textarea overlay */}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={(e) => {
            if (highlightRef.current) {
              highlightRef.current.scrollTop = e.currentTarget.scrollTop;
              highlightRef.current.scrollLeft = e.currentTarget.scrollLeft;
            }
          }}
          className="absolute inset-0 w-full h-full p-3 font-mono text-sm bg-transparent text-transparent resize-none outline-none leading-tight"
          style={{ 
            caretColor: theme === 'dark' ? 'white' : 'black',
            fontSize: '14px',
            lineHeight: '1.3',
            fontFamily: 'Menlo, Monaco, Consolas, "Andale Mono", "Ubuntu Mono", "Courier New", monospace',
            padding: '0.75rem',
            tabSize: 4,
          }}
          placeholder={placeholder}
          spellCheck={false}
        />
      </div>
    </div>
  );
}