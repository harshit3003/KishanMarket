import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  return window.location.origin;
};

const socket = io(getSocketUrl(), {
  transports: ['websocket', 'polling'],
  autoConnect: true
});

export default socket;
