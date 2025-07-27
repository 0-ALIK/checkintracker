// src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardHeader } from '@/components/dashboard-header';
import { EmployeeView } from '@/components/employee-view';
import { SupervisorView } from '@/components/supervisor-view';
import { AdminView } from '@/components/admin-view';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [viewLoaded, setViewLoaded] = useState(false);

  useEffect(() => {
    console.log(user)
    
    // Si no está cargando y no hay usuario, redirigir al login
    if (!loading && !user) {
      router.push('/');
      return;
    }
    
    // Si hay usuario, marcar la vista como cargada
    if (user) {
      setViewLoaded(true);
    }
  }, [user, loading, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (loading || !viewLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, no mostrar nada (ya se redirigió)
  if (!user) {
    return null;
  }

  // Renderizar la vista según el rol del usuario
  const renderView = () => {
    switch (user.id_rol) {
      
      case 1: // Administrador
        return <AdminView />;
      case 2: // Supervisor
        return <SupervisorView />;
      case 3: // Empleado
        return <EmployeeView />;
      default:
        return <EmployeeView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8">

        {renderView()}
      </main>
    </div>
  );
}