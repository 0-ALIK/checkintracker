// src/components/admin-view.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, FileText, Settings, BarChart, Plus, AlertCircle, Database, Play, RefreshCw } from 'lucide-react';
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

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const ejecutarCronInformes = async () => {
    setCronLoading(prev => ({ ...prev, informes: true }));
    try {
      const resultado = await apiService.ejecutarCronInformes();
      toast({
        title: "✅ Cron Ejecutado",
        description: "El proceso de envío de informes se ejecutó correctamente",
      });
      console.log('Resultado cron informes:', resultado);
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error al ejecutar el cron de informes",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, informes: false }));
    }
  };

  const ejecutarCronLimpieza = async () => {
    setCronLoading(prev => ({ ...prev, limpieza: true }));
    try {
      const resultado = await apiService.ejecutarCronLimpieza();
      toast({
        title: "✅ Limpieza Ejecutada",
        description: "La limpieza de auditorías se ejecutó correctamente",
      });
      console.log('Resultado cron limpieza:', resultado);
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error al ejecutar la limpieza",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, limpieza: false }));
    }
  };

  const limpiarAuditorias = async () => {
    setCronLoading(prev => ({ ...prev, limpiarManual: true }));
    try {
      const resultado = await apiService.limpiarAuditoriasManual(90) as any;
      toast({
        title: "✅ Limpieza Manual Completada",
        description: `Se eliminaron ${resultado.registrosEliminados || 0} registros de auditoría`,
      });
      console.log('Resultado limpieza manual:', resultado);
    } catch (error: any) {
      toast({
        title: "❌ Error",
        description: error.message || "Error en la limpieza manual",
        variant: "destructive",
      });
    } finally {
      setCronLoading(prev => ({ ...prev, limpiarManual: false }));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse w-12 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalAreas} áreas • {stats.totalRoles} roles
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jornadas Hoy</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.jornadasHoy)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.jornadasCompletadas} completadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes Aprobación</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatNumber(stats.pendientesAprobacion)}
            </div>
            <p className="text-xs text-muted-foreground">Requieren revisión</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Configuración</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Sistema</div>
            <p className="text-xs text-muted-foreground">Gestionar usuarios y roles</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Gestión de Usuarios
            </CardTitle>
            <CardDescription>
              Administrar usuarios, roles y permisos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Crear y editar usuarios</p>
              <p>• Asignar roles y áreas</p>
              <p>• Gestionar accesos</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/admin/users">
                <Plus className="h-4 w-4 mr-2" />
                Administrar Usuarios
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Jornadas Pendientes
            </CardTitle>
            <CardDescription>
              Revisar y aprobar jornadas laborales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Revisar actividades</p>
              <p>• Aprobar jornadas</p>
              <p>• Gestionar observaciones</p>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin/jornadas">
                <AlertCircle className="h-4 w-4 mr-2" />
                Ver Pendientes ({stats.pendientesAprobacion})
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Configuración
            </CardTitle>
            <CardDescription>
              Administrar áreas, roles y configuraciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>• Gestionar áreas</p>
              <p>• Configurar roles</p>
              <p>• Ajustes del sistema</p>
            </div>
            <Button asChild className="w-full" variant="outline">
              <Link href="/admin">
                <Settings className="h-4 w-4 mr-2" />
                Ir a Configuración
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Nueva sección: Administración del Sistema */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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