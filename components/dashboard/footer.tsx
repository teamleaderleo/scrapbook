import React from 'react';
import { Input } from "@/components/ui/components/input";
import { Button } from "@/components/ui/components/button";
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 p-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <PlusCircle className="h-5 w-5" />
        </Button>
        <Input
          className="flex-grow"
          placeholder="Create something..."
        />
        <Button variant="ghost" size="icon">
          <Smile className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </footer>
  );
};

export default Footer;