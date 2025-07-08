// src/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, LoginDto } from '@/types';
import { apiService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: LoginDto) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  // Verificar si hay usuario autenticado al cargar
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentUser = apiService.getCurrentUser();
        const token = localStorage.getItem('auth_token');
        
        if (currentUser && token) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (data: LoginDto) => {
    try {
      setLoading(true);
      const response = await apiService.login(data);
      setUser(response.user);
      
      toast({
        title: "¡Bienvenido!",
        description: `Hola ${response.user.nombre}`,
      });
      
      // Pequeño delay para asegurar que el estado se actualice
      setTimeout(() => {
        router.push('/dashboard');
      }, 100);
    } catch (error) {
      toast({
        title: "Error al iniciar sesión",
        description: error instanceof Error ? error.message : "Credenciales inválidas",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    router.push('/');
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};