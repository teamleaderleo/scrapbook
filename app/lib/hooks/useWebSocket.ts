import { useState, useEffect, useRef, useCallback } from 'react';

interface ConnectionStatus {
  isOnline: boolean;
  latency: number | null;
  lastPing: number | null;
}

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>({
    isOnline: false,
    latency: null,
    lastPing: null
  });
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket('ws://localhost:8080');

      ws.current.onopen = () => {
        setStatus(prev => ({ ...prev, isOnline: true }));
        console.log('Connected to WebSocket');
      };

      ws.current.onclose = () => {
        setStatus(prev => ({ ...prev, isOnline: false }));
        console.log('Disconnected from WebSocket');
        
        // Try to reconnect after 3 seconds
        reconnectTimeout.current = setTimeout(connect, 3000);
      };

      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === 'latency') {
          const latency = Date.now() - message.data;
          setStatus(prev => ({ 
            ...prev, 
            latency,
            lastPing: Date.now()
          }));
        }
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setStatus(prev => ({ ...prev, isOnline: false }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      ws.current?.close();
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  return status;
}