import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;
const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL 
    ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '') 
    : 'http://localhost:5001';

export const getSocket = (userId?: string) => {
    if (!socket && userId) {
        socket = io(SOCKET_URL, {
            query: { userId }
        });
        console.log('Socket initialized for user:', userId);
    }
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
