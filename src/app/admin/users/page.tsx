"use client";

import { useEffect, useState } from "react";
import { usersService } from "@/services/users.services";
import { UserForm } from "@/components/user-form";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id_rol === 1) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    const data = await usersService.getUsuarios();
    setUsers(data);
  };

  const handleNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    setEditingId(id);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    fetchUsers();
  };

  if (user?.id_rol !== 1) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="p-8 text-center text-destructive">No tienes permisos para acceder a esta página.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container py-8 max-w-3xl">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel de Admin
            </Link>
          </Button>
        </div>
        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>Crear y editar usuarios, asignar roles y áreas</CardDescription>
          </div>
          <Button onClick={handleNew} className="ml-auto">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Usuario
          </Button>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <div>
              <UserForm userId={editingId ?? undefined} onSuccess={handleCloseForm} />
              <Button variant="ghost" className="mt-4" onClick={handleCloseForm}>
                Cancelar
              </Button>
            </div>
          ) : (
            <>
              <Button className="mb-4" onClick={handleNew}>
                Nuevo usuario
              </Button>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left">Nombre</th>
                      <th className="text-left">Apellido</th>
                      <th className="text-left">Email</th>
                      <th className="text-left">Área</th>
                      <th className="text-left">Rol</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.nombre}</td>
                        <td>{u.apellido}</td>
                        <td>{u.email}</td>
                        <td>{u.area?.nombre_area}</td>
                        <td>{u.rol?.nombre_rol}</td>
                        <td>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(u.id)}>
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
        </div>
      </div>
  );
}