"use client";

import { useState } from "react";
import SiteNav from "@/components/site-nav";
import type { ResumeColumns } from "@/app/lib/resume-data";

interface OsuResumeSelectorProps {
  resumeColumns: ResumeColumns;
}

function getSectionOffset(index: number, selectedIndex: number): number {
  const distance = Math.abs(index - selectedIndex);
  if (distance === 0) return 12;
  if (distance === 1) return 6;
  if (distance === 2) return 3;
  return 0;
}

export default function OsuResumeSelector({ resumeColumns }: OsuResumeSelectorProps) {
  const resumeSections = resumeColumns.flat();
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (resumeSections.length === 0) {
    return (
      <main className="flex min-h-screen flex-col bg-sidebar-background">
        <SiteNav />
        <p className="m-auto p-6 text-sm text-muted-foreground">No resume sections are available.</p>
      </main>
    );
  }

  const safeSelectedIndex = Math.min(selectedIndex, resumeSections.length - 1);
  const currentSection = resumeSections[safeSelectedIndex];

  return (
    <main className="flex min-h-screen flex-col bg-sidebar-background lg:h-screen lg:overflow-hidden">
      <SiteNav />

      <div className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.1fr)]">
        <nav
          aria-label="Resume sections"
          className="border-b border-sidebar-border lg:overflow-y-auto lg:border-b-0 lg:border-r"
        >
          <div className="space-y-1 p-3 sm:p-5">
            {resumeSections.map((section, index) => {
              const isSelected = safeSelectedIndex === index;
              const offset = getSectionOffset(index, safeSelectedIndex);

              return (
                <button
                  key={`${section.title}-${section.meta}`}
                  type="button"
                  aria-pressed={isSelected}
                  aria-controls="resume-detail"
                  data-resume-section={index}
                  className={`w-full cursor-pointer rounded border-l-4 p-4 text-left transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar-background ${
                    isSelected
                      ? "border-l-primary-foreground bg-accent text-primary-foreground dark:border-l-sidebar-primary-foreground dark:bg-sidebar-accent dark:text-sidebar-primary-foreground"
                      : "border-l-transparent border-b border-border text-foreground hover:bg-muted/50 dark:border-sidebar-border dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/50"
                  }`}
                  style={{ transform: `translateX(${offset}px)` }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  onFocus={() => setSelectedIndex(index)}
                  onClick={() => setSelectedIndex(index)}
                >
                  <span className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="text-sm font-semibold sm:text-base">{section.title}</span>
                    <span className="text-xs text-muted-foreground sm:whitespace-nowrap">
                      {section.meta}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        <section
          id="resume-detail"
          aria-live="polite"
          className="p-4 sm:p-6 lg:overflow-y-auto lg:p-8"
        >
          <header className="mb-6 border-b-2 border-primary pb-4 dark:border-sidebar-primary">
            <h1
              data-resume-detail-title
              className="mb-1.5 text-xl font-bold text-foreground dark:text-sidebar-foreground sm:text-2xl"
            >
              {currentSection.title}
            </h1>
            <p className="text-sm text-muted-foreground">{currentSection.meta}</p>
          </header>

          <div className="space-y-5">
            {currentSection.items.map((item) => (
              <article key={item.bullet} className="text-sm">
                <div className="flex items-start gap-2.5">
                  <span aria-hidden="true" className="mt-1 text-foreground dark:text-sidebar-foreground">
                    •
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="leading-relaxed text-foreground dark:text-sidebar-foreground">
                      {item.bullet}
                    </p>
                    {item.note ? (
                      <p className="mt-2.5 border-l-2 border-muted pl-4 leading-relaxed text-muted-foreground">
                        {item.note}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
