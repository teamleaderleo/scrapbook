'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Expand, Shrink } from 'lucide-react';
import ScrapbookEntry, { ScrapbookItem } from './scrapbook-entry';
import { SCRAPBOOK_DATA } from './scrapbook-data';

interface ScrapbookBoardProps {
  data: ScrapbookItem[];
  title?: string;
}

const ScrapbookBoard = ({ data, title = "Scrapbook" }: ScrapbookBoardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-8">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <Button
          variant={isExpanded ? "default" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          {isExpanded ? (
            <>
              <Shrink className="w-4 h-4" />
              Contract!
            </>
          ) : (
            <>
              <Expand className="w-4 h-4" />
              Expand!
            </>
          )}
        </Button>
      </div>

      <div 
        className={`
          grid gap-4 transition-all duration-300
          ${isExpanded 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
          }
        `}
      >
        {data.map((item) => (
          <div key={item.id} className="w-80">
            <ScrapbookEntry 
              item={item} 
              isGridLayout={isExpanded}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrapbookBoard;