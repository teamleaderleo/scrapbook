import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { ScrapbookPet } from './scrapbook-pet';

const tools = [
  {
    href: '/practice',
    title: 'Code practice',
    note: 'Short functions. Type, compare, then explain.',
  },
  {
    href: '/machine-health',
    title: 'Machine health',
    note: 'Air Blue, Big Red, Windows VM, and model usage.',
  },
  {
    href: '/space/trail',
    title: 'Study trail',
    note: 'Pick up a study or choose the next question.',
  },
];

export function HomeTools() {
  return (
    <section
      aria-label="At hand"
      data-home-tools
      className="grid min-w-0 gap-5 md:grid-cols-[minmax(0,1fr)_16rem]"
    >
      <div className="min-w-0">
        <h2 className="border-b border-border pb-3 text-base font-semibold">
          At hand
        </h2>
        <div className="divide-y divide-border/60">
          {tools.map(tool => (
            <Link
              key={tool.href}
              href={tool.href}
              className="flex min-h-[64px] items-center gap-4 py-3 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">
                  {tool.title}
                </span>
                <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                  {tool.note}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-muted-foreground"
              />
            </Link>
          ))}
        </div>
      </div>
      <ScrapbookPet />
    </section>
  );
}
