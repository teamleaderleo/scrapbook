'use client';

import { useWebSocket } from '@/app/lib/hooks/useWebSocket';
import { cn } from '@/lib/utils';

export function HeaderConnectionStatus() {
  const { isOnline, latency } = useWebSocket();
  
  return (
    <div className="flex items-center space-x-1 mr-4 text-xs">
      <div 
        className={cn(
          "w-2 h-2 rounded-full",
          isOnline ? "bg-green-400" : "bg-red-400",
          "animate-pulse"
        )}
      />
      <span className="text-indigo-200">
        {isOnline ? 
          latency ? `Connected (${latency}ms)` : 'Connected' 
          : 'Offline'}
      </span>
    </div>
  );
}