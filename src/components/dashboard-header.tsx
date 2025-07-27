// src/components/dashboard-header.tsx
"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Briefcase,
  LogOut,
  User,
  Users,
  Settings,
  BarChart3,
  ClipboardList,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-headline text-xl font-bold"
          >
            <Briefcase className="h-7 w-7 text-primary" />
            <span>JornadaTrack</span>
          </Link>

          {/* Navegación específica por rol */}
          {user && (
            <nav className="hidden md:flex items-center gap-4">
              {user.id_rol === 3 && (
                <Button
                  variant={isActive("/dashboard") ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4" />
                    Mi Jornada
                  </Link>
                </Button>
              )}

              {user.id_rol === 2 && ( // Supervisor
                <>
                  <Button
                    variant={isActive("/supervisor") ? "default" : "ghost"}
                    size="sm"
                    asChild
                  >
                    <Link
                      href="/supervisor"
                      className="flex items-center gap-2"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Panel Supervisión
                    </Link>
                  </Button>
                  <Button
                    variant={
                      isActive("/supervisor/estadisticas") ? "default" : "ghost"
                    }
                    size="sm"
                    asChild
                  >
                    <Link
                      href="/supervisor/estadisticas"
                      className="flex items-center gap-2"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Estadísticas
                    </Link>
                  </Button>
                </>
              )}

              {user.id_rol === 1 && ( // Admin
                <Button
                  variant={isActive("/dasboard") ? "default" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Administración
                  </Link>
                </Button>
              )}
            </nav>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border-2 border-primary/50">
                <AvatarImage
                  src="https://placehold.co/100x100.png"
                  alt={user?.nombre || "User"}
                />
                <AvatarFallback>
                  {user
                    ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`
                    : "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user ? `${user.nombre} ${user.apellido}` : "Usuario"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || "user@example.com"}
                </p>
                <p className="text-xs leading-none text-primary font-medium">
                  {user?.id_rol === 1 && "Administrador"}
                  {user?.id_rol === 2 && "Supervisor"}
                  {user?.id_rol === 3 && "Empleado"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Enlaces rápidos por rol */}
            {user?.id_rol === 1 && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Panel Administración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin/users" className="flex w-full">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Gestión Usuarios</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {user?.id_rol === 2 && (
              <>
                <DropdownMenuItem asChild>
                  <Link href="/supervisor" className="flex w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Panel Supervisión</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/supervisor/estadisticas" className="flex w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Estadísticas Detalladas</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Mi Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
