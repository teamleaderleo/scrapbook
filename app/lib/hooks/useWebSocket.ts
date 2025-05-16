// import { useState, useEffect, useRef, useCallback } from 'react';

// export function useWebSocket() {
//   const [status, setStatus] = useState({
//     isOnline: false,
//     connectTime: null as number | null,
//     sessionTime: 0,
//     latency: null as number | null,
//     activeUsers: 0,
//     clientId: null as string | null
//   });
  
//   const ws = useRef<WebSocket | null>(null);
//   const timerRef = useRef<ReturnType<typeof setInterval>>();
//   const retryCount = useRef(0);
//   const maxRetries = 5;

//   const connectWebSocket = useCallback(() => {
//     if (retryCount.current >= maxRetries) {
//       console.warn('Max retries reached, stopping reconnection attempts');
//       return;
//     }

//     ws.current = new WebSocket('ws://localhost:8080');

//     ws.current.onopen = () => {
//       console.log('Connected to WebSocket');
//       setStatus(prev => ({ ...prev, isOnline: true }));
//       retryCount.current = 0;
//     };

//     ws.current.onclose = () => {
//       console.log('WebSocket connection closed');
//       setStatus(prev => ({ ...prev, isOnline: false }));
      
//       const backoffTime = Math.min(1000 * Math.pow(2, retryCount.current), 10000);
//       console.log(`Attempting to reconnect in ${backoffTime}ms`);
      
//       setTimeout(() => {
//         if (ws.current?.readyState === WebSocket.CLOSED) {
//           retryCount.current++;
//           connectWebSocket();
//         }
//       }, backoffTime);
//     };

//     ws.current.onmessage = (event) => {
//       const message = JSON.parse(event.data);
      
//       switch(message.type) {
//         case 'connected':
//           setStatus(prev => ({ 
//             ...prev, 
//             connectTime: message.serverTime,
//             clientId: message.clientId,
//             activeUsers: message.activeUsers
//           }));

//           timerRef.current = setInterval(() => {
//             setStatus(prev => ({
//               ...prev,
//               sessionTime: Date.now() - message.serverTime
//             }));
//           }, 1000);
//           break;

//         case 'ping':
//           const latency = Date.now() - message.timestamp;
//           setStatus(prev => ({ ...prev, latency }));
//           break;

//         case 'presence':
//           setStatus(prev => ({
//             ...prev,
//             activeUsers: message.activeUsers
//           }));
//           break;
//       }
//     };

//     ws.current.onerror = (error) => {
//       console.error('WebSocket error:', error);
//     };
//   }, []);

//   useEffect(() => {
//     connectWebSocket();

//     return () => {
//       ws.current?.close();
//       if (timerRef.current) {
//         clearInterval(timerRef.current);
//       }
//     };
//   }, [connectWebSocket]);

//   return status;
// }