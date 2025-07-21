"use client";

import { useEffect, useState } from "react";
import { usersService } from "@/services/users.services";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

// Opcional: puedes tipar mejor los props si tienes el tipo User
export type UserFormProps = {
  userId?: number; // Si está presente, es edición
  onSuccess?: () => void;
};

export function UserForm({ userId, onSuccess }: UserFormProps) {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    contraseña: "",
    id_area: "",
    id_rol: "",
  });
  const [roles, setRoles] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Los métodos de roles y áreas pueden venir de apiService o separarse en su propio service si lo prefieres
    import("@/services/api.service").then(({ apiService }) => {
      apiService.getRoles().then(setRoles);
      apiService.getAreas().then(setAreas);
    });
    if (userId) {
      usersService.getUsuario(userId).then((user) => {
        setForm({
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          contraseña: "",
          id_area: user.area?.id?.toString() || "",
          id_rol: user.rol?.id?.toString() || "",
        });
      });
    }
  }, [userId]);

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSelect = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convert string IDs to numbers
      const formData = {
        ...form,
        id_area: parseInt(form.id_area),
        id_rol: parseInt(form.id_rol),
      };

      if (userId) {
        const payload: any = { ...formData };
        if (!payload.contraseña) delete payload.contraseña;
        await usersService.updateUsuario(userId, payload);
        toast({ title: "Usuario actualizado" });
      } else {
        await usersService.createUsuario(formData);
        toast({ title: "Usuario creado" });
      }
      onSuccess?.();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Error en el formulario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Nombre</Label>
            <Input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label>Apellido</Label>
            <Input
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div>
          <Label>Email</Label>
          <Input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label>
            Contraseña {userId ? "(dejar en blanco para no cambiar)" : ""}
          </Label>
          <Input
            name="contraseña"
            type="password"
            value={form.contraseña}
            onChange={handleChange}
            minLength={userId ? 0 : 6}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Área</Label>
            <Select
              value={form.id_area}
              onValueChange={(v) => handleSelect("id_area", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona área" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((a) => (
                  <SelectItem value={a.id.toString()} key={a.id}>
                    {a.nombre_area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Rol</Label>
            <Select
              value={form.id_rol}
              onValueChange={(v) => handleSelect("id_rol", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem value={r.id.toString()} key={r.id}>
                    {r.nombre_rol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={loading}>
          {loading
            ? "Guardando..."
            : userId
            ? "Actualizar usuario"
            : "Crear usuario"}
        </Button>
      </form>
    </div>
  );
}
