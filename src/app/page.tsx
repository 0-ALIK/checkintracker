// src/app/page.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Briefcase } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      return;
    }

    setIsLoading(true);
    try {
      await login({ email, password });
    } catch (error) {
      // El error ya se maneja en el contexto
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Briefcase className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">JornadaTrack</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="usuario@pfdb.com" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Login'}
            </Button>
          </form>
          
          {/* Credenciales de prueba para desarrollo */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-4 bg-muted rounded-md text-sm">
              <p className="font-semibold mb-2">Credenciales de prueba:</p>
              <p>Admin: admin@pfdb.com / password123</p>
              <p>Supervisor: maria.gonzalez@pfdb.com / password123</p>
              <p>Empleado: pedro.silva@pfdb.com / password123</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}