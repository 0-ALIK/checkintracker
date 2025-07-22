// src/components/admin-view.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, FileText, Settings, BarChart, Plus, AlertCircle, Database, Play, RefreshCw, HardDrive, Mail } from 'lucide-react';
import { dashboardService, DashboardStats } from '@/services/dashboard.service';
import { apiService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export function AdminView() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalAreas: 0,
    totalRoles: 0,
    jornadasHoy: 0,
    jornadasCompletadas: 0,
    pendientesAprobacion: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cronLoading, setCronLoading] = useState<{[key: string]: boolean}>({});
  const [emailPrueba, setEmailPrueba] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardService.getAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ejecutarCronInformes = async () => {
    setCronLoading(prev => ({ ...prev, informes: true }));
    try {
      await apiService.ejecutarCronInformes();
      toast({
        title: "Éxito",
        description: "Informes diarios enviados correctamente",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al enviar informes",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, informes: false }));
    }
  };

  const ejecutarCronLimpieza = async () => {
    setCronLoading(prev => ({ ...prev, limpieza: true }));
    try {
      await apiService.ejecutarCronLimpieza();
      toast({
        title: "Éxito",
        description: "Limpieza automática ejecutada correctamente",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al ejecutar limpieza",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, limpieza: false }));
    }
  };

  const limpiarAuditorias = async () => {
    setCronLoading(prev => ({ ...prev, limpiarManual: true }));
    try {
      await apiService.limpiarAuditorias();
      toast({
        title: "Éxito",
        description: "Auditorías limpiadas correctamente",
        variant: "default",
      });
      loadStats();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al limpiar auditorías",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, limpiarManual: false }));
    }
  };

  const ejecutarBackupManual = async () => {
    setCronLoading(prev => ({ ...prev, backup: true }));
    try {
      const response = await apiService.ejecutarBackupManual() as { mensaje?: string };
      toast({
        title: "Éxito",
        description: response.mensaje || "Backup ejecutado correctamente",
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al ejecutar backup",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, backup: false }));
    }
  };

  const probarEmailBackup = async (tipo: 'exitoso' | 'error') => {
    if (!emailPrueba.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un email para la prueba",
        variant: "destructive",
      });
      return;
    }

    const loadingKey = `emailTest${tipo}`;
    setCronLoading(prev => ({ ...prev, [loadingKey]: true }));
    
    try {
      await apiService.probarEmailBackup(emailPrueba, tipo);
      toast({
        title: "Éxito",
        description: `Email de prueba (${tipo}) enviado a ${emailPrueba}`,
        variant: "default",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Error al enviar email de prueba",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-center items-center min-h-[200px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/usuarios/nuevo">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Usuario
            </Link>
          </Button>
          <Button variant="outline" onClick={loadStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Áreas</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAreas}</div>
            <p className="text-xs text-muted-foreground">
              Áreas de trabajo configuradas
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
            <p className="text-xs text-muted-foreground">
              Roles disponibles
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jornadas Hoy</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.jornadasHoy}</div>
            <p className="text-xs text-muted-foreground">
              Jornadas registradas hoy
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.jornadasCompletadas}</div>
            <p className="text-xs text-muted-foreground">
              Jornadas finalizadas
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendientesAprobacion}</div>
            <p className="text-xs text-muted-foreground">
              Esperando aprobación
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Administrar usuarios del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/users">
                Ver Usuarios
              </Link>
            </Button>

          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-green-600" />
              Configuración
            </CardTitle>
            <CardDescription>
              Áreas, roles y configuraciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/areas">
                Áreas
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/roles">
                Roles
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              Jornadas
            </CardTitle>
            <CardDescription>
              Gestión de jornadas laborales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/jornadas">
                Ver Jornadas
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/informes">
                Generar Informes
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-red-600" />
              Reportes
            </CardTitle>
            <CardDescription>
              Estadísticas y análisis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/reportes">
                Ver Reportes
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/auditoria">
                Auditoría
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Administración del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-indigo-600" />
              Backup de Base de Datos
            </CardTitle>
            <CardDescription>
              Respaldo automático y manual de la base de datos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Backup automático diario (03:00)</p>
              <p>• Notificaciones por email</p>
              <p>• Retención de 7 días</p>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={ejecutarBackupManual}
                disabled={cronLoading.backup}
              >
                {cronLoading.backup ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <HardDrive className="h-4 w-4 mr-2" />
                )}
                Ejecutar Backup Manual
              </Button>
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Probar emails de backup:</p>
                <Input
                  placeholder="admin@empresa.com"
                  value={emailPrueba}
                  onChange={(e) => setEmailPrueba(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => probarEmailBackup('exitoso')}
                    disabled={cronLoading.emailTestexitoso}
                  >
                    {cronLoading.emailTestexitoso ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3 mr-1" />
                    )}
                    Test Éxito
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1"
                    onClick={() => probarEmailBackup('error')}
                    disabled={cronLoading.emailTesterror}
                  >
                    {cronLoading.emailTesterror ? (
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <Mail className="h-3 w-3 mr-1" />
                    )}
                    Test Error
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-600" />
              Gestión de Auditorías
            </CardTitle>
            <CardDescription>
              Administrar registros de auditoría del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Ver logs de auditoría</p>
              <p>• Limpiar registros antiguos</p>
              <p>• Monitorear actividad</p>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={limpiarAuditorias}
                disabled={cronLoading.limpiarManual}
              >
                {cronLoading.limpiarManual ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Limpiar Auditorías (90 días)
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <Link href="/admin/auditoria">
                  Ver Registros de Auditoría
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-600" />
              Procesos Automáticos
            </CardTitle>
            <CardDescription>
              Ejecutar manualmente procesos del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Envío de informes diarios</p>
              <p>• Limpieza automática</p>
              <p>• Mantenimiento del sistema</p>
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={ejecutarCronInformes}
                disabled={cronLoading.informes}
              >
                {cronLoading.informes ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Enviar Informes Diarios
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={ejecutarCronLimpieza}
                disabled={cronLoading.limpieza}
              >
                {cronLoading.limpieza ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Ejecutar Limpieza Auto
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-blue-600" />
              Monitoreo del Sistema
            </CardTitle>
            <CardDescription>
              Estado y métricas del sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Estado de procesos cron</p>
              <p>• Métricas de rendimiento</p>
              <p>• Logs del sistema</p>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={loadStats}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar Estadísticas
              </Button>
              <div className="text-xs text-muted-foreground p-2 bg-secondary/30 rounded">
                <p>🕰️ Informes: Diarios a las 22:00</p>
                <p>🧹 Limpieza: Domingos a las 02:00</p>
                <p>💾 Backup: Diarios a las 03:00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">{error}</p>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={loadStats}
                className="ml-auto"
              >
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
