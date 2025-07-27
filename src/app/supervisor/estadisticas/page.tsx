'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard-header';
import { CalendarDays, Clock, Activity, TrendingUp, Users, FileText, ArrowLeft } from 'lucide-react';
import { supervisorDashboardService, EmployeeStats } from '@/services/supervisor-dashboard.service';
import { apiService } from '@/services/api.service';
import Link from 'next/link';

interface Employee {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  area: string;
}

export default function EstadisticasPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  // Estados para filtros
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  ); // Primer día del mes actual
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  ); // Hoy
  
  // Estados para datos
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Verificar que el usuario sea supervisor
  useEffect(() => {
    if (user && user.id_rol !== 2) {
      toast({
        title: "Acceso denegado",
        description: "Solo los supervisores pueden acceder a esta página",
        variant: "destructive",
      });
      router.push('/dashboard');
    }
  }, [user, toast, router]);

  // Cargar empleados
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const employeesData = await apiService.getUsuarios();
      
      // Filtrar solo empleados (id_rol = 3) y mapear los datos
      const employeesList = employeesData
        .filter((emp: any) => emp.id_rol === 3)
        .map((emp: any) => ({
          id: emp.id,
          nombre: emp.nombre,
          apellido: emp.apellido,
          email: emp.email,
          area: emp.area?.nombre_area || 'Sin área asignada',
        }));
      setEmployees(employeesList);
      
      // Seleccionar el primer empleado por defecto
      if (employeesList.length > 0) {
        setSelectedEmployee(employeesList[0].id);
      }
    } catch (error) {
      console.error('Error cargando empleados:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive",
      });
    } finally {
      setEmployeesLoading(false);
    }
  };

  const loadStats = async () => {
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Debes seleccionar un empleado",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const statsData = await supervisorDashboardService.getEmployeeStats(
        selectedEmployee,
        startDate,
        endDate
      );
      
      if (statsData) {
        setStats(statsData);
        toast({
          title: "Estadísticas actualizadas",
          description: "Las estadísticas se han cargado correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      toast({
        title: "Error",
        description: "Error al obtener las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Cargar estadísticas automáticamente cuando se selecciona un empleado
  useEffect(() => {
    if (selectedEmployee) {
      loadStats();
    }
  }, [selectedEmployee]);

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  // Estado de carga inicial
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  // Verificación de permisos
  if (user.id_rol !== 2) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Solo los supervisores pueden acceder a esta página.</p>
              <Button asChild>
                <Link href="/dashboard">Volver al Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (employeesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Cargando empleados...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto max-w-7xl p-4 sm:p-6 md:p-8 space-y-6">
        {/* Header con bienvenida y navegación */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link 
              href="/supervisor" 
              className="flex items-center gap-1 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Panel de Supervisor
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Estadísticas Detalladas</h1>
              <p className="text-muted-foreground">
                Análisis detallado del rendimiento de empleados • {new Date().toLocaleDateString('es-ES', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                Supervisor
              </div>
            </div>
          </div>
        </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Filtros de Consulta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee">Empleado</Label>
              <Select
                value={selectedEmployee?.toString() || ""}
                onValueChange={(value) => setSelectedEmployee(Number(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.nombre} {employee.apellido} - {employee.area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={loadStats} 
                className="w-full"
                disabled={loading || !selectedEmployee}
              >
                {loading ? "Cargando..." : "Actualizar Estadísticas"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del empleado seleccionado */}
      {selectedEmployeeData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Empleado Seleccionado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nombre Completo</p>
                <p className="font-medium">{selectedEmployeeData.nombre} {selectedEmployeeData.apellido}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{selectedEmployeeData.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Área de Trabajo</p>
                <Badge variant="secondary">{selectedEmployeeData.area}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Jornadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_jornadas}</div>
              <p className="text-xs text-muted-foreground">
                En el período seleccionado
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Horas Trabajadas</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.horas_trabajadas.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.total_jornadas > 0 
                  ? `Promedio: ${(stats.horas_trabajadas / stats.total_jornadas).toFixed(1)}h por jornada`
                  : 'Sin jornadas registradas'
                }
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividades Completadas</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.actividades_completadas}</div>
              <p className="text-xs text-muted-foreground">
                Tareas completadas con éxito
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Información adicional */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Información del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Funcionalidad:</strong> Esta página utiliza la función SQL{' '}
              <code className="bg-gray-100 px-1 rounded">obtener_estadisticas_empleado()</code>{' '}
              implementada directamente en PostgreSQL.
            </p>
            <p>
              <strong>Datos mostrados:</strong> Total de jornadas, horas trabajadas y actividades completadas
              para el empleado y rango de fechas seleccionado.
            </p>
            <p>
              <strong>Acceso:</strong> Solo disponible para usuarios con rol de Supervisor.
            </p>
            <p>
              <strong>Período predeterminado:</strong> Desde el primer día del mes actual hasta hoy.
            </p>
          </div>
        </CardContent>
      </Card>
      </main>
    </div>
  );
}
