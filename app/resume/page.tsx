"use client";

import { useState } from "react";
import SiteNav from "@/components/site-nav";
import { resumeColumns } from "../lib/resume-data";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function ResumePage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <main className="flex flex-col min-h-screen bg-sidebar-background" style={{ scrollbarGutter: 'stable' }}>
      <SiteNav />
      <div className="max-w-[1600px] mx-auto w-full px-6 sm:px-8 lg:px-12 mt-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {resumeColumns.map((sections, colIdx) => (
            <div key={colIdx} className="space-y-6">
              {sections.map((section) => {
                const sectionId = `${colIdx}-${section.title}`;
                const isExpanded = expandedSections.has(sectionId);

                return (
                  <section 
                    key={section.title} 
                    className="rounded border bg-white dark:bg-sidebar border-border dark:border-sidebar-border text-foreground dark:text-sidebar-foreground transition-colors"
                  >
                    {/* Clickable header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSection(sectionId)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h2 className="text-base font-semibold text-foreground dark:text-sidebar-foreground leading-snug">
                            {section.title}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1.5">
                            {section.meta}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-border dark:border-sidebar-border p-4">
                        <ul className="space-y-4">
                          {section.items.map((item, i) => (
                            <li key={i} className="text-sm">
                              <div className="flex items-start gap-2.5">
                                <span className="text-foreground dark:text-sidebar-foreground mt-1">•</span>
                                <div className="flex-1">
                                  <div className="text-foreground dark:text-sidebar-foreground leading-relaxed">{item.bullet}</div>
                                  {item.note && (
                                    <div className="mt-2.5 pl-4 border-l-2 border-muted text-sm text-foreground dark:text-sidebar-foreground leading-relaxed">
                                      {item.note}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}