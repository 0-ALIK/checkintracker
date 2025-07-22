"use client";

import { useState, useEffect } from "react";
import { rolesService } from "@/services/roles-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { Rol } from "@/types";
import { Plus, Pencil, Trash2, Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Rol | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre_rol: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id_rol === 1) {
      loadRoles();
    }
  }, [user]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const data = await rolesService.getRoles();
      setRoles(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar roles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setFormData({ nombre_rol: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (role: Rol) => {
    setSelectedRole(role);
    setFormData({ nombre_rol: role.nombre_rol });
    setIsDialogOpen(true);
  };

  const handleDelete = async (role: Rol) => {
    if (window.confirm(`¿Estás seguro de eliminar el rol "${role.nombre_rol}"?`)) {
      try {
        await rolesService.deleteRol(role.id);
        toast({
          title: "Rol eliminado",
          description: "El rol ha sido eliminado exitosamente",
        });
        loadRoles();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al eliminar rol",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre_rol.trim()) {
      toast({
        title: "Error",
        description: "El nombre del rol es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      if (selectedRole) {
        await rolesService.updateRol(selectedRole.id, formData);
        toast({
          title: "Rol actualizado",
          description: "El rol ha sido actualizado exitosamente",
        });
      } else {
        await rolesService.createRol(formData);
        toast({
          title: "Rol creado",
          description: "El rol ha sido creado exitosamente",
        });
      }
      
      setIsDialogOpen(false);
      setFormData({ nombre_rol: "" });
      setSelectedRole(null);
      loadRoles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar rol",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (user?.id_rol !== 1) {
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
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Cargando roles...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel de Admin
            </Link>
          </Button>
        </div>
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gestión de Roles
              </CardTitle>
              <CardDescription>
                Administra los roles del sistema y sus permisos
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nuevo Rol
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedRole ? "Editar Rol" : "Crear Nuevo Rol"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedRole 
                      ? "Modifica la información del rol seleccionado"
                      : "Completa el formulario para crear un nuevo rol"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre_rol">Nombre del Rol</Label>
                    <Input
                      id="nombre_rol"
                      name="nombre_rol"
                      value={formData.nombre_rol}
                      onChange={handleInputChange}
                      placeholder="Ej: Administrador, Supervisor, Empleado"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? "Guardando..." : selectedRole ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nombre del Rol</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No hay roles registrados.
                    </TableCell>
                  </TableRow>
                ) : (
                  roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">#{role.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          {role.nombre_rol}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(role)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(role)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </div>
      </div>
  );
}
