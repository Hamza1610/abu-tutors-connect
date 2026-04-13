import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage } from '../utils/storage';
import { authApi, userApi, saveToken, removeToken, BASE_URL } from '../services/api';
import { router } from 'expo-router';
import { io, Socket } from 'socket.io-client';

interface AuthContextType {
  user: any | null;
  token: string | null;
  socket: Socket | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const SOCKET_URL = BASE_URL.replace('/api', '');

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);

  // Socket management
  useEffect(() => {
    if (user && !socket) {
      const newSocket = io(SOCKET_URL, {
        query: { userId: user._id || user.id },
        transports: ['websocket'] // Mandatory for React Native
      });
      setSocket(newSocket);
      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user]);

  // On mount: restore session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const stored = await storage.getItem('auth_token');
        if (stored) {
          setToken(stored);
          const res = await userApi.getProfile();
          setUser(res.data);
        }
      } catch {
        await removeToken();
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token: tok, user: usr } = res.data;
    await saveToken(tok);
    setToken(tok);
    setUser(usr);
    if (usr.role === 'admin') {
      router.replace('/(tabs)/admin');
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const register = async (data: any) => {
    const res = await authApi.register(data);
    const { token: tok, user: usr } = res.data;
    await saveToken(tok);
    setToken(tok);
    setUser(usr);
    router.replace('/(tabs)/home');
  };

  const logout = async () => {
    if (socket) socket.disconnect();
    await removeToken();
    setToken(null);
    setUser(null);
    setSocket(null);
    router.replace('/login');
  };

  const refreshUser = async () => {
    const res = await userApi.getProfile();
    setUser(res.data);
  };

  return (
    <AuthContext.Provider value={{ user, token, socket, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
