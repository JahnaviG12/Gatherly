import { io } from 'socket.io-client';

const URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

export default socket;