// src/components/supervisor-view-refactored.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api.service";
import { Jornada, Actividad, Comentario } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  supervisorDashboardService,
  clearSupervisorCache,
  SupervisorDashboardStats,
  EmployeeProgress,
  ChartData,
} from "@/services/supervisor-dashboard.service";

// Componentes modulares
import { SupervisorStats } from './supervisor/SupervisorStats';
import { JornadasToday } from './supervisor/JornadasToday';
import { EmployeeProgress as EmployeeProgressComponent } from './supervisor/EmployeeProgress';
import { JornadasHistorial } from './supervisor/JornadasHistorial';
import { JornadaDetails } from './supervisor/JornadaDetails';
import { SupervisorCharts } from './supervisor/SupervisorCharts';
import { EmployeeJornada, JornadaFilters, HistorialFilters, ProgressFilters } from './supervisor/types';

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  RefreshCw,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare
} from "lucide-react";

export function SupervisorView() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [selectedJornada, setSelectedJornada] = useState<EmployeeJornada | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para dashboard
  const [stats, setStats] = useState<SupervisorDashboardStats>({
    jornadasHoy: 0,
    jornadasCompletadas: 0,
    pendientesAprobacion: 0,
    empleadosOnline: 0,
    actividadesTotales: 0,
    actividadesCompletadas: 0,
    progresoPromedio: 0,
  });
  const [employeesProgress, setEmployeesProgress] = useState<EmployeeProgress[]>([]);
  const [activitiesChart, setActivitiesChart] = useState<ChartData[]>([]);
  const [statusChart, setStatusChart] = useState<ChartData[]>([]);
  const [areaProgressChart, setAreaProgressChart] = useState<ChartData[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Estados para jornadas
  const [jornadasHoy, setJornadasHoy] = useState<EmployeeJornada[]>([]);
  const [jornadasHistorial, setJornadasHistorial] = useState<EmployeeJornada[]>([]);

  // Estados para filtros de jornadas de hoy
  const [todayFilters, setTodayFilters] = useState<JornadaFilters>({
    searchTerm: "",
    statusFilter: "all",
    areaFilter: "all",
  });

  // Estados para filtros de historial
  const [historialFilters, setHistorialFilters] = useState<HistorialFilters>({
    searchTerm: "",
    statusFilter: "all",
    areaFilter: "all",
    sortField: "fecha",
    sortDirection: "desc",
    currentPage: 1,
  });

  // Estados para paginación de progreso
  const [progressFilters, setProgressFilters] = useState<ProgressFilters>({
    currentPage: 1,
    itemsPerPage: 6,
  });

  // Cargar datos iniciales
  useEffect(() => {
    loadJornadas();
    loadDashboardData();
    
    // Actualizar cada 60 segundos
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        loadJornadas();
        loadDashboardData();
      }
    }, 60000);
    
    return () => clearInterval(interval);
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setDashboardLoading(true);
      const [statsData, progressData, chartData, statusData, areaData] = await Promise.all([
        supervisorDashboardService.getSupervisorStats(),
        supervisorDashboardService.getEmployeesProgress(),
        supervisorDashboardService.getActivitiesChartData(),
        supervisorDashboardService.getEmployeeStatusChartData(),
        supervisorDashboardService.getAreaProgressChartData(),
      ]);

      setStats(statsData);
      setEmployeesProgress(progressData);
      setActivitiesChart(chartData);
      setStatusChart(statusData);
      setAreaProgressChart(areaData);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las estadísticas del dashboard",
        variant: "destructive",
      });
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadJornadas = async () => {
    if (!user) return;

    try {
      const data = (await apiService.getJornadasForSupervisors()) as any[];

      const processedJornadas = data.map((j: any) => {
        let status: EmployeeJornada["status"] = "Offline";

        if (!j.hora_checkout && !j.aprobado) {
          status = "Pending Approval";
        } else if (!j.hora_checkout && j.aprobado) {
          status = "Online";
        } else if (j.hora_checkout && !j.aprobado) {
          status = "Pending Approval";
        } else if (j.hora_checkout && j.aprobado) {
          status = "Approved";
        }

        return { ...j, status };
      }) as EmployeeJornada[];

      // Separar jornadas del día actual vs historial
      const hoy_date = new Date();
      const today = hoy_date.getFullYear() + "-" + 
        String(hoy_date.getMonth() + 1).padStart(2, "0") + "-" + 
        String(hoy_date.getDate()).padStart(2, "0");
      
      const hoy = processedJornadas.filter((j) => j.fecha.split("T")[0] === today);
      const historial = processedJornadas.filter((j) => j.fecha.split("T")[0] !== today);

      // Ordenar jornadas de hoy por prioridad
      hoy.sort((a, b) => {
        const statusOrder = {
          "Pending Approval": 0,
          Online: 1,
          Approved: 2,
          Offline: 3,
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      // Ordenar historial por fecha descendente
      historial.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

      setJornadasHoy(hoy);
      setJornadasHistorial(historial);
    } catch (error) {
      console.error("Error loading jornadas:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las jornadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones helper
  const getUniqueAreas = useCallback(() => {
    const areas = new Set<string>();
    jornadasHistorial.forEach((j) => {
      if (j.usuario?.area?.nombre_area) {
        areas.add(j.usuario.area.nombre_area);
      }
    });
    return Array.from(areas).sort();
  }, [jornadasHistorial]);

  const getUniqueAreasToday = useCallback(() => {
    const areas = new Set<string>();
    jornadasHoy.forEach((j) => {
      if (j.usuario?.area?.nombre_area) {
        areas.add(j.usuario.area.nombre_area);
      }
    });
    return Array.from(areas).sort();
  }, [jornadasHoy]);

  const getStatusColor = (status: EmployeeJornada["status"]) => {
    switch (status) {
      case "Online":
        return "bg-green-500";
      case "Pending Approval":
        return "bg-yellow-500";
      case "Approved":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: EmployeeJornada["status"]) => {
    switch (status) {
      case "Online":
        return <Clock className="h-4 w-4" />;
      case "Pending Approval":
        return <Clock className="h-4 w-4" />;
      case "Approved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) {
      const now = new Date();
      const start = new Date(startTime);
      const diff = Math.abs(now.getTime() - start.getTime());
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m (en curso)`;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const diff = Math.abs(end.getTime() - start.getTime());
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Handlers para filtros
  const handleTodayFiltersChange = (newFilters: Partial<JornadaFilters>) => {
    setTodayFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleHistorialFiltersChange = (newFilters: Partial<HistorialFilters>) => {
    setHistorialFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleProgressFiltersChange = (newFilters: Partial<ProgressFilters>) => {
    setProgressFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetTodayFilters = () => {
    setTodayFilters({
      searchTerm: "",
      statusFilter: "all",
      areaFilter: "all",
    });
  };

  const resetHistorialFilters = () => {
    setHistorialFilters({
      searchTerm: "",
      statusFilter: "all",
      areaFilter: "all",
      sortField: "fecha",
      sortDirection: "desc",
      currentPage: 1,
    });
  };

  const handleSort = (field: string) => {
    setHistorialFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc",
      currentPage: 1,
    }));
  };

  // Handlers para jornadas
  const loadJornadaDetails = async (jornada: EmployeeJornada) => {
    setSelectedJornada(jornada);
    setSheetOpen(true);

    try {
      const [acts, comments] = await Promise.all([
        apiService.getActividadesByJornada(jornada.id_jornada),
        apiService.getComentariosByJornada(jornada.id_jornada),
      ]);
      setActividades(acts);
      setComentarios(comments as Comentario[]);
    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  const handleApprove = async () => {
    if (!selectedJornada) return;

    setIsProcessing(true);
    try {
      await apiService.aprobarJornada(selectedJornada.id_jornada);

      toast({
        title: selectedJornada.hora_checkout ? "Checkout aprobado" : "Checkin aprobado",
        description: selectedJornada.hora_checkout
          ? "El checkout ha sido aprobado exitosamente"
          : "El checkin ha sido aprobado. El empleado puede gestionar sus tareas.",
      });

      setSelectedJornada(prev => prev ? { ...prev, aprobado: true } : null);
      setSheetOpen(false);
      loadJornadas();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la jornada",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedJornada || !newComment) {
      toast({
        title: "Error",
        description: "Debes agregar un motivo para rechazar",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      await apiService.rechazarJornada(selectedJornada.id_jornada, newComment);

      toast({
        title: "Jornada rechazada",
        description: "La jornada ha sido rechazada",
      });

      setSheetOpen(false);
      setNewComment("");
      loadJornadas();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la jornada",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedActivityId || !newComment) return;

    try {
      await apiService.createComentario({
        id_actividad: selectedActivityId,
        comentario: newComment,
      });

      toast({
        title: "Comentario agregado",
        description: "El comentario se ha guardado correctamente",
      });

      setNewComment("");
      setSelectedActivityId(null);

      const comments = await apiService.getComentariosByJornada(selectedJornada!.id_jornada);
      setComentarios(comments as Comentario[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

  if (loading || dashboardLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Cargando panel de supervisión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de Bienvenida */}
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-bold">
          ¡Bienvenido, {user?.nombre}!
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString("es-ES", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Supervisión</h2>
          <p className="text-muted-foreground">
            Monitorea y gestiona las jornadas laborales de todos los empleados
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Actualización automática cada 60s
          </div>
          <Button
            variant="outline"
            onClick={() => {
              clearSupervisorCache();
              loadDashboardData();
            }}
            disabled={dashboardLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${dashboardLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Dashboard de Estadísticas */}
      <SupervisorStats stats={stats} loading={dashboardLoading} />

      {/* Gestión de Jornadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gestión de Jornadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="today" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Jornadas de Hoy ({jornadasHoy.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Historial ({jornadasHistorial.length})
              </TabsTrigger>
            </TabsList>

            {/* Tab de Jornadas de Hoy */}
            <TabsContent value="today" className="space-y-4">
              <JornadasToday
                jornadas={jornadasHoy}
                filters={todayFilters}
                onFiltersChange={handleTodayFiltersChange}
                onResetFilters={resetTodayFilters}
                onViewDetails={loadJornadaDetails}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                formatTime={formatTime}
                getUniqueAreas={getUniqueAreasToday}
              />
            </TabsContent>

            {/* Tab de Historial */}
            <TabsContent value="history" className="space-y-4">
              <JornadasHistorial
                jornadas={jornadasHistorial}
                filters={historialFilters}
                itemsPerPage={10}
                onFiltersChange={handleHistorialFiltersChange}
                onResetFilters={resetHistorialFilters}
                onSort={handleSort}
                onViewDetails={loadJornadaDetails}
                getStatusColor={getStatusColor}
                getStatusIcon={getStatusIcon}
                formatTime={formatTime}
                formatDate={formatDate}
                getUniqueAreas={getUniqueAreas}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progreso Individual de Empleados */}
      {employeesProgress.length > 0 && (
        <EmployeeProgressComponent
          employees={employeesProgress}
          filters={progressFilters}
          onPageChange={(page) => handleProgressFiltersChange({ currentPage: page })}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Gráficos y Visualizaciones */}
      <SupervisorCharts
        jornadas={[...jornadasHoy, ...jornadasHistorial]}
        todayJornadas={jornadasHoy}
        formatDuration={formatDuration}
        getUniqueAreas={getUniqueAreas}
      />

      {/* Modal de Detalles de Jornada */}
      <JornadaDetails
        jornada={selectedJornada}
        isOpen={sheetOpen}
        onOpenChange={setSheetOpen}
        getStatusColor={getStatusColor}
        getStatusIcon={getStatusIcon}
        formatTime={formatTime}
        formatDate={formatDate}
        formatDuration={formatDuration}
      />

      {/* Sheet para acciones de aprobación - Mantener funcionalidad original */}
      <Sheet open={sheetOpen && selectedJornada?.status === "Pending Approval"} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
          {selectedJornada && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {selectedJornada.usuario?.nombre} {selectedJornada.usuario?.apellido}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  Detalles de la jornada del {formatDate(selectedJornada.fecha)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Acciones de aprobación */}
                {selectedJornada.status === "Pending Approval" && !selectedJornada.aprobado && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {!selectedJornada.hora_checkout ? "Aprobar Check-in" : "Aprobar Check-out"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {!selectedJornada.hora_checkout
                            ? "El empleado podrá gestionar sus tareas después de la aprobación del check-in."
                            : "Revisa las actividades completadas antes de aprobar el check-out."
                          }
                        </p>

                        <Button onClick={handleApprove} disabled={isProcessing} className="w-full">
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {isProcessing
                            ? "Procesando..."
                            : !selectedJornada.hora_checkout
                            ? "Aprobar Check-in"
                            : "Aprobar Check-out"
                          }
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="rejection-reason">Motivo de rechazo (opcional para aprobar, requerido para rechazar)</Label>
                        <Textarea
                          id="rejection-reason"
                          placeholder={`Motivo de rechazo del ${
                            !selectedJornada.hora_checkout ? "check-in" : "check-out"
                          }...`}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {isProcessing ? "Procesando..." : "Rechazar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Agregar comentarios a actividades */}
                {actividades.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Actividades</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {actividades.map((actividad) => (
                          <div key={actividad.id} className="border rounded-lg p-3">
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium">{actividad.tarea}</h4>
                                <p className="text-sm text-muted-foreground">{actividad.meta}</p>
                                {actividad.observaciones && (
                                  <p className="text-sm text-muted-foreground mt-1">{actividad.observaciones}</p>
                                )}
                              </div>

                              {/* Comentarios existentes */}
                              {comentarios.filter(c => c.id_actividad === actividad.id).length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs font-medium mb-1">Comentarios del supervisor:</p>
                                  {comentarios
                                    .filter(c => c.id_actividad === actividad.id)
                                    .map((c) => (
                                      <div key={c.id} className="text-xs bg-secondary p-2 rounded mt-1">
                                        <p className="font-medium">{c.usuario?.nombre} {c.usuario?.apellido}</p>
                                        <p>{c.comentario}</p>
                                        <p className="text-muted-foreground mt-1">
                                          {formatDate(c.fecha_comentario)} - {formatTime(c.fecha_comentario)}
                                        </p>
                                      </div>
                                    ))
                                  }
                                </div>
                              )}

                              {/* Agregar comentario */}
                              {selectedActivityId === actividad.id ? (
                                <div className="mt-2 space-y-2">
                                  <Label htmlFor="activity-comment">Comentario del supervisor:</Label>
                                  <Textarea
                                    id="activity-comment"
                                    placeholder="Escribe feedback sobre esta tarea específica..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={3}
                                  />
                                  <div className="flex space-x-2">
                                    <Button size="sm" onClick={handleAddComment}>
                                      Guardar Comentario
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline" 
                                      onClick={() => {
                                        setSelectedActivityId(null);
                                        setNewComment("");
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedActivityId(actividad.id)}
                                >
                                  <MessageSquare className="mr-1 h-3 w-3" />
                                  Comentar Tarea
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSheetOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
