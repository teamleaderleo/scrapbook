import React from 'react';
import { Card } from '@/components/ui/card';

const ScrapbookEntry = () => {
  return (
    <Card className="bg-yellow-50 p-4 shadow-md max-w-xs">
      <p className="font-mono text-sm">
        • Reduced GET request latency from 300ms to 50ms through optimized queries and TanStack Query caching.
      </p>
    </Card>
  );
};

export default ScrapbookEntry;