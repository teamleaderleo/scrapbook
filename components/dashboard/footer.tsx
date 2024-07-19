'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 p-4">
      <div className="flex justify-between items-center">
        <span>&copy; 2024 Setzen</span>
        <Button variant="outline">Quick Chat</Button>
      </div>
    </footer>
  );
};

export default Footer;