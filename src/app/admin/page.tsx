"use client";

import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, Building } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Verificar que el usuario tenga permisos de administrador (rol 1)
    if (user && user.id_rol !== 1) {
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

  if (user.id_rol !== 1) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
              <CardDescription>
                No tienes permisos para acceder a esta sección.
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Panel de Administración</h1>
        <p className="text-muted-foreground mt-2">
          Administra usuarios, roles y configuraciones del sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Crear, editar y administrar usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Crear nuevos usuarios</li>
              <li>• Asignar roles y áreas</li>
              <li>• Gestionar accesos</li>
              <li>• Editar información personal</li>
            </ul>
            <Button asChild className="w-full">
              <Link href="/admin/users">Administrar Usuarios</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Gestión de Roles
            </CardTitle>
            <CardDescription>
              Administrar roles y permisos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Crear nuevos roles</li>
              <li>• Definir permisos</li>
              <li>• Asignar responsabilidades</li>
              <li>• Configurar accesos</li>
            </ul>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/roles">Administrar Roles</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-purple-600" />
              Gestión de Áreas
            </CardTitle>
            <CardDescription>
              Administrar áreas y departamentos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground mb-4 space-y-1">
              <li>• Crear nuevas áreas</li>
              <li>• Organizar departamentos</li>
              <li>• Asignar usuarios</li>
              <li>• Estructurar organización</li>
            </ul>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/areas">Administrar Áreas</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Información del Administrador</CardTitle>
            <CardDescription>
              Tu información de sesión actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Nombre:</strong> {user.nombre} {user.apellido}
              </div>
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              <div>
                <strong>Rol:</strong> {user.rol?.nombre_rol || "No asignado"}
              </div>
              <div>
                <strong>Área:</strong> {user.area?.nombre_area || "No asignada"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
