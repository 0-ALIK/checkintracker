// src/components/supervisor-view.tsx
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  Calendar,
  FileText,
  BarChart,
  RefreshCw,
  TrendingUp,
  Activity,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
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

interface EmployeeJornada extends Jornada {
  status: "Online" | "Offline" | "Pending Approval" | "Approved";
}

export function SupervisorView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jornadas, setJornadas] = useState<EmployeeJornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJornada, setSelectedJornada] = useState<Jornada | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [newComment, setNewComment] = useState("");
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(
    null
  );
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
  const [employeesProgress, setEmployeesProgress] = useState<
    EmployeeProgress[]
  >([]);
  const [activitiesChart, setActivitiesChart] = useState<ChartData[]>([]);
  const [statusChart, setStatusChart] = useState<ChartData[]>([]);
  const [areaProgressChart, setAreaProgressChart] = useState<ChartData[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Estados para filtros y búsqueda de jornadas
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<string>("fecha");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Estados para filtros de jornadas de hoy
  const [searchTermToday, setSearchTermToday] = useState("");
  const [statusFilterToday, setStatusFilterToday] = useState<string>("all");
  const [areaFilterToday, setAreaFilterToday] = useState<string>("all");

  // Estados para paginación de progreso individual
  const [progressCurrentPage, setProgressCurrentPage] = useState(1);
  const [progressItemsPerPage] = useState(6); // 2x3 grid para mejor rendimiento

  // Separar jornadas del día y historial
  const [jornadasHoy, setJornadasHoy] = useState<EmployeeJornada[]>([]);
  const [jornadasHistorial, setJornadasHistorial] = useState<EmployeeJornada[]>(
    []
  );

  useEffect(() => {
    loadJornadas();
    loadDashboardData();
    // Actualizar cada 60 segundos (reducido de 15 segundos)
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
      const [statsData, progressData, chartData, statusData, areaData] =
        await Promise.all([
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
          status = "Pending Approval"; // Check-in pendiente
        } else if (!j.hora_checkout && j.aprobado) {
          status = "Online"; // Trabajando (check-in aprobado, sin checkout)
        } else if (j.hora_checkout && !j.aprobado) {
          status = "Pending Approval"; // Check-out pendiente de aprobación
        } else if (j.hora_checkout && j.aprobado) {
          status = "Approved"; // Jornada completamente aprobada
        }

        return { ...j, status };
      }) as EmployeeJornada[];

      // Separar jornadas del día actual vs historial
      const hoy_date = new Date();
      const today =
        hoy_date.getFullYear() +
        "-" +
        String(hoy_date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(hoy_date.getDate()).padStart(2, "0");
      const hoy = processedJornadas.filter(
        (j) => j.fecha.split("T")[0] === today
      );
      const historial = processedJornadas.filter(
        (j) => j.fecha.split("T")[0] !== today
      );

      // Ordenar jornadas de hoy por prioridad
      hoy.sort((a, b) => {
        const statusOrder = {
          "Pending Approval": 0, // Prioridad máxima
          Online: 1, // Trabajando
          Approved: 2, // Completados
          Offline: 3, // Sin actividad
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });

      // Ordenar historial por fecha descendente
      historial.sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      );

      setJornadasHoy(hoy);
      setJornadasHistorial(historial);
      setJornadas(processedJornadas); // Mantener para compatibilidad
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

  // Funciones de filtrado y búsqueda optimizadas con useCallback
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

  const filterJornadas = useCallback(
    (jornadas: EmployeeJornada[]) => {
      return jornadas.filter((jornada) => {
        // Filtro por búsqueda de texto
        const searchMatch =
          searchTerm === "" ||
          jornada.usuario?.nombre
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          jornada.usuario?.apellido
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          jornada.usuario?.email
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        // Filtro por estado
        const statusMatch =
          statusFilter === "all" || jornada.status === statusFilter;

        // Filtro por área
        const areaMatch =
          areaFilter === "all" ||
          jornada.usuario?.area?.nombre_area === areaFilter;

        return searchMatch && statusMatch && areaMatch;
      });
    },
    [searchTerm, statusFilter, areaFilter]
  );

  const filterJornadasToday = useCallback(
    (jornadas: EmployeeJornada[]) => {
      return jornadas.filter((jornada) => {
        // Filtro por búsqueda de texto
        const searchMatch =
          searchTermToday === "" ||
          jornada.usuario?.nombre
            ?.toLowerCase()
            .includes(searchTermToday.toLowerCase()) ||
          jornada.usuario?.apellido
            ?.toLowerCase()
            .includes(searchTermToday.toLowerCase()) ||
          jornada.usuario?.email
            ?.toLowerCase()
            .includes(searchTermToday.toLowerCase());

        // Filtro por estado
        const statusMatch =
          statusFilterToday === "all" || jornada.status === statusFilterToday;

        // Filtro por área
        const areaMatch =
          areaFilterToday === "all" ||
          jornada.usuario?.area?.nombre_area === areaFilterToday;

        return searchMatch && statusMatch && areaMatch;
      });
    },
    [searchTermToday, statusFilterToday, areaFilterToday]
  );

  const sortJornadas = (jornadas: EmployeeJornada[]) => {
    return [...jornadas].sort((a, b) => {
      let valueA: any, valueB: any;

      switch (sortField) {
        case "empleado":
          valueA = `${a.usuario?.nombre || ""} ${a.usuario?.apellido || ""}`;
          valueB = `${b.usuario?.nombre || ""} ${b.usuario?.apellido || ""}`;
          break;
        case "area":
          valueA = a.usuario?.area?.nombre_area || "";
          valueB = b.usuario?.area?.nombre_area || "";
          break;
        case "status":
          valueA = a.status;
          valueB = b.status;
          break;
        case "fecha":
          valueA = new Date(a.fecha).getTime();
          valueB = new Date(b.fecha).getTime();
          break;
        case "checkin":
          valueA = new Date(a.hora_checkin).getTime();
          valueB = new Date(b.hora_checkin).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1;
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  };

  const getPaginatedJornadas = (jornadas: EmployeeJornada[]) => {
    const filtered = filterJornadas(jornadas);
    const sorted = sortJornadas(filtered);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      data: sorted.slice(startIndex, endIndex),
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / itemsPerPage),
    };
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setStatusFilter("all");
    setAreaFilter("all");
    setSortField("fecha");
    setSortDirection("desc");
    setCurrentPage(1);
  }, []);

  const resetFiltersToday = useCallback(() => {
    setSearchTermToday("");
    setStatusFilterToday("all");
    setAreaFilterToday("all");
  }, []);

  const getPaginatedEmployeesProgress = useCallback(() => {
    const startIndex = (progressCurrentPage - 1) * progressItemsPerPage;
    const endIndex = startIndex + progressItemsPerPage;

    return {
      data: employeesProgress.slice(startIndex, endIndex),
      total: employeesProgress.length,
      totalPages: Math.ceil(employeesProgress.length / progressItemsPerPage),
    };
  }, [employeesProgress, progressCurrentPage, progressItemsPerPage]);

  // Memoizar datos filtrados para evitar recálculos innecesarios
  const filteredJornadasToday = useMemo(
    () => filterJornadasToday(jornadasHoy),
    [filterJornadasToday, jornadasHoy]
  );

  const paginatedEmployeesProgress = useMemo(
    () => getPaginatedEmployeesProgress(),
    [getPaginatedEmployeesProgress]
  );

  const loadJornadaDetails = async (jornada: Jornada) => {
    setSelectedJornada(jornada);
    setSheetOpen(true);

    try {
      // Cargar actividades y comentarios
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
        title: selectedJornada.hora_checkout
          ? "Checkout aprobado"
          : "Checkin aprobado",
        description: selectedJornada.hora_checkout
          ? "El checkout ha sido aprobado exitosamente"
          : "El checkin ha sido aprobado. El empleado puede gestionar sus tareas.",
      });

      // Actualizar la jornada seleccionada
      setSelectedJornada((prev) => (prev ? { ...prev, aprobado: true } : null));
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

      // Recargar comentarios
      const comments = await apiService.getComentariosByJornada(
        selectedJornada!.id_jornada
      );
      setComentarios(comments as Comentario[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

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
        return <Clock className="h-4 w-4" />; // Cambiar Timer por Clock
      case "Approved":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />; // Cambiar User por Users
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
          <h2 className="text-3xl font-bold tracking-tight">
            Panel de Supervisión
          </h2>
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
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                dashboardLoading ? "animate-spin" : ""
              }`}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Dashboard de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">
              Empleados Trabajando
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.empleadosOnline}
            </div>
            <p className="text-xs text-muted-foreground">
              Actualmente trabajando
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes Aprobación
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendientesAprobacion}
            </div>
            <p className="text-xs text-muted-foreground">Esperando revisión</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Progreso Promedio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.progresoPromedio}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.actividadesCompletadas}/{stats.actividadesTotales}{" "}
              actividades
            </p>
          </CardContent>
        </Card>
      </div>

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
              {jornadasHoy.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">No hay jornadas registradas hoy</p>
                  <p className="text-sm">
                    Los empleados pueden iniciar sus jornadas desde la
                    aplicación
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Métricas rápidas del día */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-yellow-800">
                        {
                          filterJornadasToday(jornadasHoy).filter(
                            (j) => j.status === "Pending Approval"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-yellow-700">Pendientes</div>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-green-800">
                        {
                          filterJornadasToday(jornadasHoy).filter(
                            (j) => j.status === "Online"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-green-700">Trabajando</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-blue-800">
                        {
                          filterJornadasToday(jornadasHoy).filter(
                            (j) => j.status === "Approved"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-blue-700">Completadas</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-800">
                        {
                          filterJornadasToday(jornadasHoy).filter(
                            (j) => j.status === "Offline"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-gray-700">Sin Actividad</div>
                    </div>
                  </div>

                  {/* Filtros para jornadas de hoy */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="space-y-2">
                      <Label
                        htmlFor="searchToday"
                        className="text-sm font-medium"
                      >
                        Buscar empleado
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="searchToday"
                          placeholder="Nombre, apellido o email..."
                          value={searchTermToday}
                          onChange={(e) => setSearchTermToday(e.target.value)}
                          className="pl-8 h-9"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Estado</Label>
                      <Select
                        value={statusFilterToday}
                        onValueChange={setStatusFilterToday}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los estados</SelectItem>
                          <SelectItem value="Pending Approval">
                            Pendiente Aprobación
                          </SelectItem>
                          <SelectItem value="Online">Trabajando</SelectItem>
                          <SelectItem value="Approved">Aprobado</SelectItem>
                          <SelectItem value="Offline">Sin Actividad</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Área</Label>
                      <Select
                        value={areaFilterToday}
                        onValueChange={setAreaFilterToday}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las áreas</SelectItem>
                          {getUniqueAreasToday().map((area) => (
                            <SelectItem key={area} value={area}>
                              {area}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Acciones</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-full"
                        onClick={resetFiltersToday}
                      >
                        <RefreshCw className="mr-1 h-3 w-3" />
                        Limpiar Filtros
                      </Button>
                    </div>
                  </div>

                  {(() => {
                    return (
                      <>
                        {/* Información de resultados */}
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <span>
                            Mostrando {filteredJornadasToday.length} de{" "}
                            {jornadasHoy.length} jornadas de hoy
                          </span>
                          {(searchTermToday ||
                            statusFilterToday !== "all" ||
                            areaFilterToday !== "all") && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={resetFiltersToday}
                            >
                              <RefreshCw className="mr-1 h-3 w-3" />
                              Limpiar filtros
                            </Button>
                          )}
                        </div>

                        {/* Lista de jornadas de hoy con scroll optimizado */}
                        <div className="rounded-md border">
                          <div
                            className={`${
                              filteredJornadasToday.length > 6
                                ? "max-h-[400px] overflow-y-auto"
                                : ""
                            }`}
                          >
                            <Table>
                              <TableHeader
                                className={`${
                                  filteredJornadasToday.length > 6
                                    ? "sticky top-0 bg-background z-10"
                                    : ""
                                }`}
                              >
                                <TableRow>
                                  <TableHead>Empleado</TableHead>
                                  <TableHead>Área</TableHead>
                                  <TableHead>Estado</TableHead>
                                  <TableHead>Check-in</TableHead>
                                  <TableHead>Check-out</TableHead>
                                  <TableHead>Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredJornadasToday.map((jornada) => (
                                  <TableRow
                                    key={jornada.id_jornada}
                                    className="hover:bg-muted/50"
                                  >
                                    <TableCell>
                                      <div className="flex items-center space-x-2">
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 flex-shrink-0">
                                          <span className="text-xs font-medium text-primary">
                                            {jornada.usuario
                                              ? `${jornada.usuario.nombre.charAt(
                                                  0
                                                )}${jornada.usuario.apellido.charAt(
                                                  0
                                                )}`
                                              : "U"}
                                          </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <p className="font-medium text-sm truncate">
                                            {jornada.usuario
                                              ? `${jornada.usuario.nombre} ${jornada.usuario.apellido}`
                                              : "Usuario Desconocido"}
                                          </p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {jornada.usuario?.email}
                                          </p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {jornada.usuario?.area?.nombre_area ||
                                          "No asignada"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="secondary"
                                        className={`${getStatusColor(
                                          jornada.status
                                        )} text-white text-xs`}
                                      >
                                        <div className="flex items-center space-x-1">
                                          {getStatusIcon(jornada.status)}
                                          <span className="hidden sm:inline">
                                            {jornada.status === "Online" &&
                                              "Trabajando"}
                                            {jornada.status ===
                                              "Pending Approval" &&
                                              (jornada.hora_checkout
                                                ? "Check-out Pendiente"
                                                : "Check-in Pendiente")}
                                            {jornada.status === "Approved" &&
                                              "Completada"}
                                            {jornada.status === "Offline" &&
                                              "Sin Actividad"}
                                          </span>
                                        </div>
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {formatTime(jornada.hora_checkin)}
                                    </TableCell>
                                    <TableCell className="font-mono text-sm">
                                      {jornada.hora_checkout ? (
                                        formatTime(jornada.hora_checkout)
                                      ) : (
                                        <span className="text-muted-foreground italic">
                                          En curso
                                        </span>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          loadJornadaDetails(jornada)
                                        }
                                        className="h-7 px-2"
                                      >
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </TabsContent>

            {/* Tab de Historial */}
            <TabsContent value="history" className="space-y-4">
              {/* Controles de filtrado y búsqueda */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="search" className="text-sm font-medium">
                    Buscar empleado
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Nombre, apellido o email..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Estado</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="Pending Approval">
                        Pendiente Aprobación
                      </SelectItem>
                      <SelectItem value="Online">Trabajando</SelectItem>
                      <SelectItem value="Approved">Aprobado</SelectItem>
                      <SelectItem value="Offline">Sin Actividad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Área</Label>
                  <Select
                    value={areaFilter}
                    onValueChange={(value) => {
                      setAreaFilter(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las áreas</SelectItem>
                      {getUniqueAreas().map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Acciones</Label>
                  <div className="flex gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-9 flex-1"
                        >
                          <Filter className="mr-1 h-3 w-3" />
                          Ordenar
                          <ChevronDown className="ml-1 h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSort("fecha")}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Por Fecha
                          {sortField === "fecha" &&
                            (sortDirection === "asc" ? (
                              <SortAsc className="ml-2 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-2 h-4 w-4" />
                            ))}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleSort("empleado")}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Por Empleado
                          {sortField === "empleado" &&
                            (sortDirection === "asc" ? (
                              <SortAsc className="ml-2 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-2 h-4 w-4" />
                            ))}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("area")}>
                          <FileText className="mr-2 h-4 w-4" />
                          Por Área
                          {sortField === "area" &&
                            (sortDirection === "asc" ? (
                              <SortAsc className="ml-2 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-2 h-4 w-4" />
                            ))}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSort("status")}>
                          <Activity className="mr-2 h-4 w-4" />
                          Por Estado
                          {sortField === "status" &&
                            (sortDirection === "asc" ? (
                              <SortAsc className="ml-2 h-4 w-4" />
                            ) : (
                              <SortDesc className="ml-2 h-4 w-4" />
                            ))}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={resetFilters}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Limpiar Filtros
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {(() => {
                const {
                  data: paginatedData,
                  total,
                  totalPages,
                } = getPaginatedJornadas(jornadasHistorial);

                return (
                  <>
                    {/* Información de resultados */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Mostrando{" "}
                        {paginatedData.length > 0
                          ? (currentPage - 1) * itemsPerPage + 1
                          : 0}{" "}
                        a {Math.min(currentPage * itemsPerPage, total)} de{" "}
                        {total} jornadas
                      </span>
                      {(searchTerm ||
                        statusFilter !== "all" ||
                        areaFilter !== "all") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={resetFilters}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Limpiar filtros
                        </Button>
                      )}
                    </div>

                    {/* Tabla de historial */}
                    {paginatedData.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No se encontraron jornadas</p>
                        <p className="text-sm">
                          Intenta ajustar los filtros de búsqueda
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <div className="max-h-[350px] overflow-y-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-background z-10">
                              <TableRow>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("empleado")}
                                >
                                  <div className="flex items-center">
                                    Empleado
                                    {sortField === "empleado" &&
                                      (sortDirection === "asc" ? (
                                        <SortAsc className="ml-1 h-3 w-3" />
                                      ) : (
                                        <SortDesc className="ml-1 h-3 w-3" />
                                      ))}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("area")}
                                >
                                  <div className="flex items-center">
                                    Área
                                    {sortField === "area" &&
                                      (sortDirection === "asc" ? (
                                        <SortAsc className="ml-1 h-3 w-3" />
                                      ) : (
                                        <SortDesc className="ml-1 h-3 w-3" />
                                      ))}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("status")}
                                >
                                  <div className="flex items-center">
                                    Estado
                                    {sortField === "status" &&
                                      (sortDirection === "asc" ? (
                                        <SortAsc className="ml-1 h-3 w-3" />
                                      ) : (
                                        <SortDesc className="ml-1 h-3 w-3" />
                                      ))}
                                  </div>
                                </TableHead>
                                <TableHead
                                  className="cursor-pointer hover:bg-muted/50"
                                  onClick={() => handleSort("fecha")}
                                >
                                  <div className="flex items-center">
                                    Fecha
                                    {sortField === "fecha" &&
                                      (sortDirection === "asc" ? (
                                        <SortAsc className="ml-1 h-3 w-3" />
                                      ) : (
                                        <SortDesc className="ml-1 h-3 w-3" />
                                      ))}
                                  </div>
                                </TableHead>
                                <TableHead>Check-in</TableHead>
                                <TableHead>Check-out</TableHead>
                                <TableHead>Acciones</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {paginatedData.map((jornada) => (
                                <TableRow
                                  key={jornada.id_jornada}
                                  className="hover:bg-muted/50"
                                >
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 flex-shrink-0">
                                        <span className="text-xs font-medium text-primary">
                                          {jornada.usuario
                                            ? `${jornada.usuario.nombre.charAt(
                                                0
                                              )}${jornada.usuario.apellido.charAt(
                                                0
                                              )}`
                                            : "U"}
                                        </span>
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">
                                          {jornada.usuario
                                            ? `${jornada.usuario.nombre} ${jornada.usuario.apellido}`
                                            : "Usuario Desconocido"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {jornada.usuario?.email}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {jornada.usuario?.area?.nombre_area ||
                                        "No asignada"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="secondary"
                                      className={`${getStatusColor(
                                        jornada.status
                                      )} text-white text-xs`}
                                    >
                                      <div className="flex items-center space-x-1">
                                        {getStatusIcon(jornada.status)}
                                        <span className="hidden sm:inline">
                                          {jornada.status === "Online" &&
                                            "Trabajando"}
                                          {jornada.status ===
                                            "Pending Approval" && "Pendiente"}
                                          {jornada.status === "Approved" &&
                                            "Aprobado"}
                                          {jornada.status === "Offline" &&
                                            "Sin Actividad"}
                                        </span>
                                      </div>
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-sm">
                                    {formatDate(jornada.fecha)}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {formatTime(jornada.hora_checkin)}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {jornada.hora_checkout ? (
                                      formatTime(jornada.hora_checkout)
                                    ) : (
                                      <span className="text-muted-foreground italic">
                                        En curso
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        loadJornadaDetails(jornada)
                                      }
                                      className="h-7 px-2"
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          Página {currentPage} de {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(Math.max(1, currentPage - 1))
                            }
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </Button>

                          {/* Números de página */}
                          <div className="flex items-center space-x-1">
                            {Array.from(
                              { length: Math.min(5, totalPages) },
                              (_, i) => {
                                let pageNum = i + 1;
                                if (totalPages > 5) {
                                  if (currentPage <= 3) {
                                    pageNum = i + 1;
                                  } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                  } else {
                                    pageNum = currentPage - 2 + i;
                                  }
                                }

                                return (
                                  <Button
                                    key={pageNum}
                                    variant={
                                      currentPage === pageNum
                                        ? "default"
                                        : "outline"
                                    }
                                    size="sm"
                                    onClick={() => setCurrentPage(pageNum)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {pageNum}
                                  </Button>
                                );
                              }
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCurrentPage(
                                Math.min(totalPages, currentPage + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                          >
                            Siguiente
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {/* Progreso Individual de Empleados */}
      {employeesProgress.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Progreso Individual de Empleados
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Seguimiento detallado del rendimiento de cada empleado
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Información de paginación */}
              {employeesProgress.length > progressItemsPerPage && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Mostrando{" "}
                    {(progressCurrentPage - 1) * progressItemsPerPage + 1} a{" "}
                    {Math.min(
                      progressCurrentPage * progressItemsPerPage,
                      paginatedEmployeesProgress.total
                    )}{" "}
                    de {paginatedEmployeesProgress.total} empleados
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setProgressCurrentPage(
                          Math.max(1, progressCurrentPage - 1)
                        )
                      }
                      disabled={progressCurrentPage === 1}
                    >
                      Anterior
                    </Button>

                    <span className="text-sm text-muted-foreground px-2">
                      {progressCurrentPage} /{" "}
                      {paginatedEmployeesProgress.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setProgressCurrentPage(
                          Math.min(
                            paginatedEmployeesProgress.totalPages,
                            progressCurrentPage + 1
                          )
                        )
                      }
                      disabled={
                        progressCurrentPage ===
                        paginatedEmployeesProgress.totalPages
                      }
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}

              {/* Grid de empleados optimizado - 2x3 para mejor rendimiento */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedEmployeesProgress.data.map((empleado) => (
                  <div
                    key={empleado.id_usuario}
                    className="border rounded-lg p-3 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                          <span className="text-xs font-medium text-primary">
                            {empleado.nombre.charAt(0)}
                            {empleado.apellido.charAt(0)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">
                            {empleado.nombre} {empleado.apellido}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {empleado.area}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`${getStatusColor(
                          empleado.estado_jornada
                        )} text-white text-xs flex-shrink-0`}
                      >
                        {empleado.estado_jornada === "Online" && "Trabajando"}
                        {empleado.estado_jornada === "Pending Approval" &&
                          "Pendiente"}
                        {empleado.estado_jornada === "Approved" && "Completado"}
                        {empleado.estado_jornada === "Offline" &&
                          "Desconectado"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-1 mb-3 text-center">
                      <div className="bg-gray-50 rounded p-1.5">
                        <div className="text-sm font-bold text-gray-800">
                          {empleado.total_actividades}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Total
                        </div>
                      </div>
                      <div className="bg-green-50 rounded p-1.5">
                        <div className="text-sm font-bold text-green-600">
                          {empleado.completadas}
                        </div>
                        <div className="text-xs text-muted-foreground">OK</div>
                      </div>
                      <div className="bg-yellow-50 rounded p-1.5">
                        <div className="text-sm font-bold text-yellow-600">
                          {empleado.en_progreso}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Prog
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded p-1.5">
                        <div className="text-sm font-bold text-gray-600">
                          {empleado.pendientes}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pend
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progreso:</span>
                        <span className="text-sm font-bold text-primary">
                          {empleado.progreso_porcentaje}%
                        </span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${empleado.progreso_porcentaje}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginación inferior simplificada */}
              {employeesProgress.length > progressItemsPerPage && (
                <div className="flex justify-center pt-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setProgressCurrentPage(
                          Math.max(1, progressCurrentPage - 1)
                        )
                      }
                      disabled={progressCurrentPage === 1}
                    >
                      ←
                    </Button>

                    <span className="text-sm text-muted-foreground px-3">
                      {progressCurrentPage} de{" "}
                      {paginatedEmployeesProgress.totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setProgressCurrentPage(
                          Math.min(
                            paginatedEmployeesProgress.totalPages,
                            progressCurrentPage + 1
                          )
                        )
                      }
                      disabled={
                        progressCurrentPage ===
                        paginatedEmployeesProgress.totalPages
                      }
                    >
                      →
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {/* Gráficas de Progreso */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-8">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Estado de Actividades
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Distribución de {stats.actividadesTotales} actividades totales
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activitiesChart}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {activitiesChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} actividades`,
                      name,
                    ]}
                    labelFormatter={() => ""}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) =>
                      `${value}: ${entry.payload.value} (${(
                        (entry.payload.value / stats.actividadesTotales) *
                        100
                      ).toFixed(0)}%)`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado de Empleados
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Estados actuales de {employeesProgress.length} empleados
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChart}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={false}
                    outerRadius={120}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {statusChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} empleados`,
                      name,
                    ]}
                    labelFormatter={() => ""}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) =>
                      `${value}: ${entry.payload.value}`
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica de Progreso por Área */}
      {areaProgressChart.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progreso por Área de Trabajo
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Porcentaje de actividades completadas por área
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart
                  data={areaProgressChart}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                  />
                  <YAxis
                    label={{
                      value: "% Completado",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${value}%`,
                      "Progreso",
                    ]}
                    labelFormatter={(label: any) => `Área: ${label}`}
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-3 border rounded shadow-lg">
                            <p className="font-medium">{`Área: ${label}`}</p>
                            <p className="text-blue-600">{`Progreso: ${data.value}%`}</p>
                            <p className="text-sm text-gray-600">{`Empleados: ${data.empleados}`}</p>
                            <p className="text-sm text-gray-600">{`Actividades: ${data.completadas}/${data.actividades}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gestión de Jornadas */}

      {/* Sheet para ver detalles */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
          {selectedJornada && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {selectedJornada.usuario?.nombre}{" "}
                    {selectedJornada.usuario?.apellido}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  Detalles de la jornada del {formatDate(selectedJornada.fecha)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Información básica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Información de la Jornada
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Check-in:</span>
                      <span>{formatTime(selectedJornada.hora_checkin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Check-out:</span>
                      <span>
                        {selectedJornada.hora_checkout
                          ? formatTime(selectedJornada.hora_checkout)
                          : "En curso"}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Observaciones del empleado */}
                {selectedJornada.observaciones && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Observaciones del Empleado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedJornada.observaciones}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Actividades */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actividades.length > 0 ? (
                      <div className="space-y-3">
                        {actividades.map((actividad) => (
                          <div
                            key={actividad.id}
                            className="border rounded-lg p-3"
                          >
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium">
                                  {actividad.tarea}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {actividad.meta}
                                </p>
                                {actividad.observaciones && (
                                  <p className="text-sm italic mt-1">
                                    {actividad.observaciones}
                                  </p>
                                )}
                                <Badge variant="outline" className="mt-1">
                                  {actividad.id_estado === 3
                                    ? "Completada"
                                    : actividad.id_estado === 2
                                    ? "En Progreso"
                                    : "Pendiente"}
                                </Badge>
                              </div>

                              {/* Comentarios existentes */}
                              {comentarios.filter(
                                (c) => c.id_actividad === actividad.id
                              ).length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs font-medium mb-1">
                                    Comentarios:
                                  </p>
                                  {comentarios
                                    .filter(
                                      (c) => c.id_actividad === actividad.id
                                    )
                                    .map((c) => (
                                      <div
                                        key={c.id}
                                        className="text-xs bg-secondary p-2 rounded mt-1"
                                      >
                                        <p className="font-medium">
                                          {c.usuario
                                            ? `${c.usuario.nombre} ${c.usuario.apellido}`
                                            : "Usuario"}
                                          :
                                        </p>
                                        <p>{c.comentario}</p>
                                        <p className="text-muted-foreground">
                                          {new Date(
                                            c.fecha_comentario
                                          ).toLocaleString("es-ES")}
                                        </p>
                                      </div>
                                    ))}
                                </div>
                              )}

                              {/* Agregar comentario - Mejorar UX */}
                              {selectedActivityId === actividad.id ? (
                                <div className="mt-2 space-y-2">
                                  <Label htmlFor="comment">
                                    Comentario del supervisor:
                                  </Label>
                                  <Textarea
                                    id="comment"
                                    placeholder="Escribe feedback sobre esta tarea específica..."
                                    value={newComment}
                                    onChange={(e) =>
                                      setNewComment(e.target.value)
                                    }
                                    rows={3}
                                  />
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={handleAddComment}
                                      disabled={!newComment.trim()}
                                    >
                                      <MessageSquare className="mr-1 h-3 w-3" />
                                      Agregar Comentario
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
                                  onClick={() =>
                                    setSelectedActivityId(actividad.id)
                                  }
                                >
                                  <MessageSquare className="mr-1 h-3 w-3" />
                                  Comentar Tarea
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No se registraron actividades
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Acciones de aprobación - Mostrar solo si está pendiente */}
                {(selectedJornada as EmployeeJornada).status ===
                  "Pending Approval" &&
                  !selectedJornada.aprobado && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">
                          {!selectedJornada.hora_checkout
                            ? "Aprobar Check-in"
                            : "Aprobar Check-out"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-sm text-muted-foreground">
                            {!selectedJornada.hora_checkout
                              ? "El empleado podrá gestionar sus tareas después de la aprobación del check-in."
                              : "Revisa las actividades completadas antes de aprobar el check-out."}
                          </p>

                          <Button
                            onClick={handleApprove}
                            disabled={isProcessing}
                            className="w-full"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {isProcessing
                              ? "Procesando..."
                              : !selectedJornada.hora_checkout
                              ? "Aprobar Check-in"
                              : "Aprobar Check-out"}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <Textarea
                            placeholder={`Motivo de rechazo del ${
                              !selectedJornada.hora_checkout
                                ? "check-in"
                                : "check-out"
                            } (opcional para aprobar, requerido para rechazar)...`}
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
