import { io } from 'socket.io-client';

// Connect directly to backend port 5000 for WebSockets
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

export default socket;
