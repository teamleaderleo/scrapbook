'use client';

import { useWebSocket } from '@/app/lib/hooks/useWebSocket';
import { cn } from '@/lib/utils';

function formatElapsedTime(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

export function HeaderConnectionStatus() {
  const { isOnline, latency, sessionTime, activeUsers } = useWebSocket();
  
  return (
    <div className="flex items-center space-x-2 mr-4 text-xs">
      <div 
        className={cn(
          "w-2 h-2 rounded-full",
          isOnline ? "bg-green-400" : "bg-red-400",
          "animate-pulse"
        )}
      />
      <span className="text-gray-600">
        {isOnline ? (
          <>
            <span className="mr-1">
              {activeUsers > 1 
                ? `${activeUsers} people are here! We've been here for ` 
                : "We've been here for "}
            </span>
            <span className="font-medium">{formatElapsedTime(sessionTime)}!</span>
            {latency !== null && <span className="ml-1 text-gray-400">({latency}ms)</span>}
          </>
        ) : (
          'Offline'
        )}
      </span>
    </div>
  );
}