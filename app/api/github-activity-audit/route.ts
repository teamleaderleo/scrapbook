import { parsePublicContributionHtml } from '@/lib/github-activity-utils';
import { NextResponse } from 'next/server';

const USERNAME = 'teamleaderleo';
const CELL_PATTERN = /<(?:td|rect)\b([^>]*data-date="(\d{4}-\d{2}-\d{2})"[^>]*)>/gi;
const TOOLTIP_PATTERN = /<tool-tip\b[^>]*for="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/gi;

function plainText(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function contributionCount(label: string): number | null {
  if (/no contributions?/i.test(label)) return 0;
  const match = label.match(/([\d,]+) contributions?/i);
  return match ? Number(match[1].replaceAll(',', '')) : null;
}

export async function GET() {
  const response = await fetch(`https://github.com/users/${USERNAME}/contributions`, {
    cache: 'no-store',
    headers: { Accept: 'text/html', 'User-Agent': 'teamleaderleo-scrapbook-audit' },
  });

  if (!response.ok) {
    return NextResponse.json({ ok: false, status: response.status }, { status: 502 });
  }

  const html = await response.text();
  const parsed = parsePublicContributionHtml(html);
  const tooltips = new Map<string, number>();
  for (const match of html.matchAll(TOOLTIP_PATTERN)) {
    const count = contributionCount(plainText(match[2]));
    if (count !== null) tooltips.set(match[1], count);
  }

  const cells = [];
  let directCountCells = 0;
  let tooltipCountCells = 0;
  for (const match of html.matchAll(CELL_PATTERN)) {
    const attributes = match[1];
    const date = match[2];
    const direct = attributes.match(/data-count="(\d+)"/i)?.[1];
    const id = attributes.match(/id="([^"]+)"/i)?.[1];
    if (direct !== undefined) directCountCells += 1;
    if (id && tooltips.has(id)) tooltipCountCells += 1;
    cells.push({
      date,
      direct: direct === undefined ? null : Number(direct),
      tooltip: id ? (tooltips.get(id) ?? null) : null,
      parsed: parsed.get(date) ?? null,
    });
  }

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    htmlBytes: html.length,
    parsedDays: parsed.size,
    cellCount: cells.length,
    directCountCells,
    tooltipCountCells,
    recent: cells.slice(-45),
  });
}
