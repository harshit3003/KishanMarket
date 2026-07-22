import { io } from 'socket.io-client';

// Automatically detect backend host URL (dynamic in production or localhost in dev)
const URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? window.location.origin
  : 'http://localhost:5000';

const socket = io(URL, {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

export default socket;
