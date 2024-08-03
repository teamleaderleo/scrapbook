'use client';

import React from 'react';
import { Input } from "@/components/ui/components/input";
import { Button } from "@/components/ui/components/button";
import { PlusCircle, Smile, SendHorizontal } from 'lucide-react';
import { useUIStore } from '@/app/lib/stores/ui-store';

const Footer: React.FC = () => {
  const { currentProject } = useUIStore();

  const placeholder = currentProject
    ? `Create something in ${currentProject.name}...`
    : "Create something...";

  return (
    <footer className="bg-[#36393f] border-t border-[#2f3136] p-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <PlusCircle className="h-5 w-5" />
        </Button>
        <Input
          className="flex-grow bg-[#40444b] border-none text-white placeholder-[#72767d]"
          placeholder={placeholder}
        />
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <Smile className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#b9bbbe] hover:text-white hover:bg-[#4f545c]">
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </footer>
  );
};

export default Footer;