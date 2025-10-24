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
    <main className="flex flex-col min-h-screen bg-sidebar-background">
      <SiteNav />
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-4 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {resumeColumns.map((sections, colIdx) => (
            <div key={colIdx} className="space-y-4">
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
                      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleSection(sectionId)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <h2 className="text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                            {section.title}
                          </h2>
                          <p className="text-xs text-muted-foreground mt-1">
                            {section.meta}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="border-t border-border dark:border-sidebar-border p-3">
                        <ul className="space-y-3">
                          {section.items.map((item, i) => (
                            <li key={i} className="text-sm">
                              <div className="flex items-start gap-2">
                                <span className="text-foreground dark:text-sidebar-foreground mt-0.5">•</span>
                                <div className="flex-1">
                                  <div className="text-foreground dark:text-sidebar-foreground">{item.bullet}</div>
                                  {item.note && (
                                    <div className="mt-2 pl-3 border-l-2 border-muted text-xs text-foreground dark:text-sidebar-foreground">
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