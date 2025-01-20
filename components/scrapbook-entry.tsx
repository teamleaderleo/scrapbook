import React from 'react';
import { Card } from '@/components/ui/card';

interface ScrapbookEntryProps {
  text: string;
}

const ScrapbookEntry: React.FC<ScrapbookEntryProps> = ({ text }) => {
  return (
    <Card className="bg-yellow-50 p-4 shadow-md max-w-xs">
      <p className="font-mono text-sm">
        {text}
      </p>
    </Card>
  );
};

export default ScrapbookEntry;