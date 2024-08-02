'use client';

import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/components/button";
import { ChevronDown } from 'lucide-react';

const views = [
  { name: 'Chat', value: 'chat' },
  { name: 'Portfolio', value: 'portfolio' },
  { name: 'Blog', value: 'blog' },
  { name: 'Calendar', value: 'calendar' },
];

const ViewSwitcher = () => {
  const [currentView, setCurrentView] = React.useState(views[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between">
          {currentView.name}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        {views.map((view) => (
          <DropdownMenuItem 
            key={view.value}
            onSelect={() => setCurrentView(view)}
          >
            {view.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ViewSwitcher;