import React from 'react';
import Link from 'next/link';
import { Button } from "@/components/ui/components/button";
import { PlusCircle, MessageSquare, FileText } from 'lucide-react';

export const QuickAccess = () => (
  <div className="flex space-x-2 p-4 border-t">
    <Link href="/dashboard/projects/create">
      <Button variant="outline" size="sm">
        <PlusCircle className="mr-2 h-4 w-4" />
        New Project
      </Button>
    </Link>
    <Link href="/dashboard/blocks/create">
      <Button variant="outline" size="sm">
        <FileText className="mr-2 h-4 w-4" />
        New Artifact
      </Button>
    </Link>
    <Button variant="outline" size="sm">
      <MessageSquare className="mr-2 h-4 w-4" />
      Quick Chat
    </Button>
  </div>
);