"use client";

import { useState, useEffect } from "react";
import { areasService } from "@/services/areas-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardHeader } from "@/components/dashboard-header";
import { Area } from "@/types";
import { Plus, Pencil, Trash2, Building, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ nombre_area: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id_rol === 1) {
      loadAreas();
    }
  }, [user]);

  const loadAreas = async () => {
    try {
      setLoading(true);
      const data = await areasService.getAreas();
      setAreas(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar áreas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedArea(null);
    setFormData({ nombre_area: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (area: Area) => {
    setSelectedArea(area);
    setFormData({ nombre_area: area.nombre_area });
    setIsDialogOpen(true);
  };

  const handleDelete = async (area: Area) => {
    if (window.confirm(`¿Estás seguro de eliminar el área "${area.nombre_area}"?`)) {
      try {
        await areasService.deleteArea(area.id);
        toast({
          title: "Área eliminada",
          description: "El área ha sido eliminada exitosamente",
        });
        loadAreas();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al eliminar área",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre_area.trim()) {
      toast({
        title: "Error",
        description: "El nombre del área es obligatorio",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      if (selectedArea) {
        await areasService.updateArea(selectedArea.id, formData);
        toast({
          title: "Área actualizada",
          description: "El área ha sido actualizada exitosamente",
        });
      } else {
        await areasService.createArea(formData);
        toast({
          title: "Área creada",
          description: "El área ha sido creada exitosamente",
        });
      }
      
      setIsDialogOpen(false);
      setFormData({ nombre_area: "" });
      setSelectedArea(null);
      loadAreas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al guardar área",
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
            <div className="text-lg">Cargando áreas...</div>
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
            <Link href="/dashboard">
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
                <Building className="h-5 w-5" />
                Gestión de Áreas
              </CardTitle>
              <CardDescription>
                Administra las áreas y departamentos de la organización
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Área
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {selectedArea ? "Editar Área" : "Crear Nueva Área"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedArea 
                      ? "Modifica la información del área seleccionada"
                      : "Completa el formulario para crear una nueva área"
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="nombre_area">Nombre del Área</Label>
                    <Input
                      id="nombre_area"
                      name="nombre_area"
                      value={formData.nombre_area}
                      onChange={handleInputChange}
                      placeholder="Ej: Recursos Humanos, Contabilidad, Ventas"
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
                      {saving ? "Guardando..." : selectedArea ? "Actualizar" : "Crear"}
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
                  <TableHead>Nombre del Área</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No hay áreas registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  areas.map((area) => (
                    <TableRow key={area.id}>
                      <TableCell className="font-medium">#{area.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          {area.nombre_area}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(area)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(area)}
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
