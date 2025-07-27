"use client";

import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { SupervisorView } from "@/components/supervisor-view";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SupervisorPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Verificar que el usuario tenga permisos de supervisor (rol 2)
    if (user && user.id_rol !== 2) {
      router.push("/dashboard");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Cargando...</div>
        </div>
      </div>
    );
  }

  if (user.id_rol !== 2) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
              <CardDescription>
                No tienes permisos de supervisor para acceder a esta sección.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/dashboard">Volver al Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto p-6">
        <SupervisorView />
      </div>
    </div>
  );
}
