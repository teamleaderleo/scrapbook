"use client";

import { useState, useEffect, useRef } from "react";
import SiteNav from "@/components/site-nav";

interface ResumeItem {
  bullet: string;
  note?: string;
}

interface ResumeSection {
  title: string;
  meta: string;
  items: ResumeItem[];
}

interface OsuResumeSelectorProps {
  resumeColumns: ResumeSection[][];
}

export default function OsuResumeSelector({ resumeColumns }: OsuResumeSelectorProps) {
  // Flatten the columns into a single array
  const resumeSections = resumeColumns.flat();
  
  const [hoveredIndex, setHoveredIndex] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Load anime.js
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/animejs/3.2.1/anime.min.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    
    if (!(window as any).anime) return;

    // Animate list items
    itemRefs.current.forEach((item, i) => {
      if (!item) return;
      
      const distance = Math.abs(i - index);
      const isHovered = i === index;
      
      (window as any).anime({
        targets: item,
        translateX: isHovered ? 15 : distance <= 2 ? 8 - (distance * 3) : 0,
        duration: 250,
        easing: 'easeOutCubic',
      });
    });
  };

  const currentSection = resumeSections[hoveredIndex];

  return (
    <main className="flex flex-col h-screen bg-sidebar-background" style={{ scrollbarGutter: 'stable' }}>
      <SiteNav />
      
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left side - List */}
        <div className="w-1/2 border-r border-sidebar-border flex flex-col overflow-y-auto">
          <div className="flex-1 pl-6 pr-6 pt-3">
            {resumeSections.map((section, index) => {
              const isHovered = hoveredIndex === index;
              
              return (
                <div
                  key={index}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(index)}
                  style={{ zIndex: isHovered ? 10 : 1 }}
                >
                  <div
                    className={`
                      p-4 cursor-pointer transition-all duration-200
                      ${isHovered ? 'bg-accent dark:bg-sidebar-accent rounded border-l-4 border-l-primary-foreground dark:border-l-sidebar-primary-foreground' : 'border-b border-border dark:border-sidebar-border hover:bg-muted/50 dark:hover:bg-sidebar-accent/50'}
                    `}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <h2 className={`text-base font-semibold transition-colors duration-200 ${
                        isHovered ? 'text-primary-foreground dark:text-sidebar-primary-foreground' : 'text-foreground dark:text-sidebar-foreground'
                      }`}>
                        {section.title}
                      </h2>
                      <span className="text-muted-foreground text-xs whitespace-nowrap">
                        {section.meta}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right side - Details */}
        <div className="w-1/2 p-6 overflow-y-auto">
          <div>
            {/* Section header */}
            <div className="mb-6 pb-4 border-b-2 border-primary dark:border-sidebar-primary">
              <h2 className="text-xl font-bold text-foreground dark:text-sidebar-foreground mb-1.5">
                {currentSection.title}
              </h2>
              <p className="text-muted-foreground text-sm">{currentSection.meta}</p>
            </div>

            {/* Section content */}
            <div className="space-y-4">
              {currentSection.items.map((item, i) => (
                <div 
                  key={i}
                  className="text-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-foreground dark:text-sidebar-foreground mt-1">•</span>
                    <div className="flex-1">
                      <div className="text-foreground dark:text-sidebar-foreground leading-relaxed">
                        {item.bullet}
                      </div>
                      {item.note && (
                        <div className="mt-2.5 pl-4 border-l-2 border-muted text-sm text-foreground dark:text-sidebar-foreground leading-relaxed">
                          {item.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}