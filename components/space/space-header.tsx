"use client";
import { useState } from 'react';
import { useAuth } from '@/app/lib/hooks/useAuth';
import { AuthModal } from '../auth-modal';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

export function SpaceHeader() {
  const { user, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  return (
    <>
      <header className="border-b px-6 py-3 flex items-center justify-between bg-white">
        <div>
          <h1 className="text-xl font-bold">Scrapbook</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-gray-600">{user.email}</span>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={() => setShowAuthModal(true)}
            >
              <User className="w-4 h-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
      </header>
      
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
    </>
  );
}