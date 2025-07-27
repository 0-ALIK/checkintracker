import { apiService } from './api.service';

// Cache para evitar peticiones duplicadas
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 segundos

function getCachedData(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

export function clearSupervisorCache() {
  cache.clear();
}

export interface SupervisorDashboardStats {
  jornadasHoy: number;
  jornadasCompletadas: number;
  pendientesAprobacion: number;
  empleadosOnline: number;
  actividadesTotales: number;
  actividadesCompletadas: number;
  progresoPromedio: number;
}

export interface EmployeeProgress {
  id_usuario: number;
  nombre: string;
  apellido: string;
  area: string;
  total_actividades: number;
  completadas: number;
  en_progreso: number;
  pendientes: number;
  progreso_porcentaje: number;
  estado_jornada: 'Online' | 'Offline' | 'Pending Approval' | 'Approved';
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface EmployeeStats {
  total_jornadas: number;
  horas_trabajadas: number;
  actividades_completadas: number;
}

class SupervisorDashboardService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getAuthHeaders() {
    // Siempre obtener el token más reciente
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
    
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `${this.token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `Error ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.message || 'Error en la solicitud');
    }
    if (response.status === 204) {
      return {} as T;
    }
    return response.json();
  }
  async getSupervisorStats(): Promise<SupervisorDashboardStats> {
    const cacheKey = 'supervisor_stats';
    const cached = getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const jornadas = await apiService.getJornadasForSupervisors() as any[];
      const hoy = new Date().toISOString().split('T')[0];
      
      // Filtrar jornadas de hoy
      const jornadasHoy = jornadas.filter((j: any) => 
        j.fecha && j.fecha.startsWith(hoy)
      );
      
      const jornadasCompletadas = jornadasHoy.filter((j: any) => 
        j.aprobado && j.hora_checkout
      );
      
      const pendientesAprobacion = jornadasHoy.filter((j: any) => 
        !j.aprobado || (j.hora_checkout && !j.aprobado)
      );
      
      const empleadosOnline = jornadasHoy.filter((j: any) => 
        j.aprobado && !j.hora_checkout
      );

      // Calcular estadísticas de actividades
      let actividadesTotales = 0;
      let actividadesCompletadas = 0;
      
      jornadasHoy.forEach((jornada: any) => {
        if (jornada.actividades) {
          actividadesTotales += jornada.actividades.length;
          actividadesCompletadas += jornada.actividades.filter((a: any) => a.id_estado === 3).length;
        }
      });

      const progresoPromedio = actividadesTotales > 0 
        ? Math.round((actividadesCompletadas / actividadesTotales) * 100)
        : 0;

      const result = {
        jornadasHoy: jornadasHoy.length,
        jornadasCompletadas: jornadasCompletadas.length,
        pendientesAprobacion: pendientesAprobacion.length,
        empleadosOnline: empleadosOnline.length,
        actividadesTotales,
        actividadesCompletadas,
        progresoPromedio,
      };

      setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error obteniendo estadísticas de supervisor:', error);
      return {
        jornadasHoy: 0,
        jornadasCompletadas: 0,
        pendientesAprobacion: 0,
        empleadosOnline: 0,
        actividadesTotales: 0,
        actividadesCompletadas: 0,
        progresoPromedio: 0,
      };
    }
  }

  async getEmployeesProgress(): Promise<EmployeeProgress[]> {
    try {
      const jornadas = await apiService.getJornadasForSupervisors() as any[];
      const hoy = new Date().toISOString().split('T')[0];
      
      // Agrupar jornadas por empleado (solo las de hoy)
      const jornadasHoy = jornadas.filter((j: any) => 
        j.fecha && j.fecha.startsWith(hoy)
      );

      const empleadosMap = new Map();
      
      jornadasHoy.forEach((jornada: any) => {
        const empleadoId = jornada.usuario.id;
        
        if (!empleadosMap.has(empleadoId)) {
          empleadosMap.set(empleadoId, {
            id_usuario: empleadoId,
            nombre: jornada.usuario.nombre,
            apellido: jornada.usuario.apellido,
            area: jornada.usuario.area?.nombre_area || 'No asignada',
            actividades: [],
            estado_jornada: this.getJornadaStatus(jornada)
          });
        }
        
        if (jornada.actividades) {
          empleadosMap.get(empleadoId).actividades.push(...jornada.actividades);
        }
      });

      // Convertir a array y calcular estadísticas
      return Array.from(empleadosMap.values()).map((empleado: any) => {
        const total_actividades = empleado.actividades.length;
        const completadas = empleado.actividades.filter((a: any) => a.id_estado === 3).length;
        const en_progreso = empleado.actividades.filter((a: any) => a.id_estado === 2).length;
        const pendientes = empleado.actividades.filter((a: any) => a.id_estado === 1).length;
        const progreso_porcentaje = total_actividades > 0 
          ? Math.round((completadas / total_actividades) * 100)
          : 0;

        return {
          id_usuario: empleado.id_usuario,
          nombre: empleado.nombre,
          apellido: empleado.apellido,
          area: empleado.area,
          total_actividades,
          completadas,
          en_progreso,
          pendientes,
          progreso_porcentaje,
          estado_jornada: empleado.estado_jornada
        };
      });
    } catch (error) {
      console.error('Error obteniendo progreso de empleados:', error);
      return [];
    }
  }

  async getActivitiesChartData(): Promise<ChartData[]> {
    try {
      const employeesProgress = await this.getEmployeesProgress();
      
      let totalCompletadas = 0;
      let totalEnProgreso = 0;
      let totalPendientes = 0;

      employeesProgress.forEach(emp => {
        totalCompletadas += emp.completadas;
        totalEnProgreso += emp.en_progreso;
        totalPendientes += emp.pendientes;
      });

      return [
        {
          name: 'Completadas',
          value: totalCompletadas,
          color: '#10b981' // green-500
        },
        {
          name: 'En Progreso',
          value: totalEnProgreso,
          color: '#f59e0b' // yellow-500
        },
        {
          name: 'Pendientes',
          value: totalPendientes,
          color: '#6b7280' // gray-500
        }
      ];
    } catch (error) {
      console.error('Error obteniendo datos de gráfica:', error);
      return [];
    }
  }

  async getEmployeeStatusChartData(): Promise<ChartData[]> {
    try {
      const employeesProgress = await this.getEmployeesProgress();
      
      const statusCount = {
        'Online': 0,
        'Pending Approval': 0,
        'Approved': 0,
        'Offline': 0
      };

      employeesProgress.forEach(emp => {
        statusCount[emp.estado_jornada]++;
      });

      return [
        {
          name: 'Trabajando',
          value: statusCount['Online'],
          color: '#10b981' // green-500
        },
        {
          name: 'Pendiente Aprobación',
          value: statusCount['Pending Approval'],
          color: '#f59e0b' // yellow-500
        },
        {
          name: 'Completados',
          value: statusCount['Approved'],
          color: '#3b82f6' // blue-500
        },
        {
          name: 'Desconectados',
          value: statusCount['Offline'],
          color: '#6b7280' // gray-500
        }
      ];
    } catch (error) {
      console.error('Error obteniendo datos de estado:', error);
      return [];
    }
  }

  async getAreaProgressChartData(): Promise<ChartData[]> {
    try {
      const employeesProgress = await this.getEmployeesProgress();
      
      // Agrupar por área
      const areaMap = new Map();
      
      employeesProgress.forEach(emp => {
        const area = emp.area;
        if (!areaMap.has(area)) {
          areaMap.set(area, {
            totalActividades: 0,
            completadas: 0,
            empleados: 0
          });
        }
        
        const areaData = areaMap.get(area);
        areaData.totalActividades += emp.total_actividades;
        areaData.completadas += emp.completadas;
        areaData.empleados += 1;
      });

      return Array.from(areaMap.entries()).map(([area, data]: [string, any]) => ({
        name: area,
        value: data.totalActividades > 0 
          ? Math.round((data.completadas / data.totalActividades) * 100)
          : 0,
        empleados: data.empleados,
        actividades: data.totalActividades,
        completadas: data.completadas
      }));
    } catch (error) {
      console.error('Error obteniendo datos de progreso por área:', error);
      return [];
    }
  }

  private getJornadaStatus(jornada: any): 'Online' | 'Offline' | 'Pending Approval' | 'Approved' {
    if (!jornada.hora_checkout && !jornada.aprobado) {
      return 'Pending Approval'; // Check-in pendiente
    } else if (!jornada.hora_checkout && jornada.aprobado) {
      return 'Online'; // Trabajando (check-in aprobado, sin checkout)
    } else if (jornada.hora_checkout && !jornada.aprobado) {
      return 'Pending Approval'; // Check-out pendiente de aprobación
    } else if (jornada.hora_checkout && jornada.aprobado) {
      return 'Approved'; // Jornada completamente aprobada
    }
    return 'Offline';
  }

  async getEmployeeStats(userId: number, startDate: string, endDate: string): Promise<EmployeeStats | null> {
    try {
      const data = await this.request<any[]>(`/jornadas/stats/${userId}?startDate=${startDate}&endDate=${endDate}`);
      
      // La función SQL devuelve un array con un objeto
      if (data && data.length > 0) {
        return {
          total_jornadas: Number(data[0].total_jornadas) || 0,
          horas_trabajadas: Number(data[0].horas_trabajadas) || 0,
          actividades_completadas: Number(data[0].actividades_completadas) || 0,
        };
      }

      return {
        total_jornadas: 0,
        horas_trabajadas: 0,
        actividades_completadas: 0,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas del empleado:', error);
      return null;
    }
  }
}

export const supervisorDashboardService = new SupervisorDashboardService();
