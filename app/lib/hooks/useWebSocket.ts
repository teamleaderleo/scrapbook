import { useState, useEffect, useRef, useCallback } from 'react';

export function useWebSocket() {
  const [status, setStatus] = useState({
    isOnline: false,
    connectTime: null as number | null,
    sessionTime: 0,
    latency: null as number | null
  });
  
  const ws = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    ws.current = new WebSocket('ws://localhost:8080');

    ws.current.onopen = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
    };

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch(message.type) {
        case 'connected':
          setStatus(prev => ({ 
            ...prev, 
            connectTime: message.serverTime 
          }));

          timerRef.current = setInterval(() => {
            setStatus(prev => ({
              ...prev,
              sessionTime: Date.now() - message.serverTime
            }));
          }, 1000);
          break;

        case 'ping':
          // Calculate latency
          const latency = Date.now() - message.timestamp;
          setStatus(prev => ({ ...prev, latency }));
          break;
      }
    };

    return () => {
      ws.current?.close();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return status;
}