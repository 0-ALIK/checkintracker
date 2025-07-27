import { apiService } from './api.service';
import { usersService } from './users.services';
import { jornadasService } from './jornadas.service';

export interface DashboardStats {
  totalUsers: number;
  totalAreas: number;
  totalRoles: number;
  jornadasHoy: number;
  jornadasCompletadas: number;
  pendientesAprobacion: number;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalAreas: number;
  totalRoles: number;
}

class DashboardService {
  async getAdminStats(): Promise<DashboardStats> {
    try {
      // Obtener datos de forma paralela
      const [usuarios, areas, roles, jornadas] = await Promise.all([
        usersService.getUsuarios(),
        apiService.getAreas(),
        apiService.getRoles(),
        this.getJornadasData()
      ]);

      return {
        totalUsers: usuarios.length,
        totalAreas: areas.length,
        totalRoles: roles.length,
        jornadasHoy: jornadas.jornadasHoy,
        jornadasCompletadas: jornadas.jornadasCompletadas,
        pendientesAprobacion: jornadas.pendientesAprobacion,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      // Devolver datos por defecto en caso de error
      return {
        totalUsers: 0,
        totalAreas: 0,
        totalRoles: 0,
        jornadasHoy: 0,
        jornadasCompletadas: 0,
        pendientesAprobacion: 0,
      };
    }
  }

  async getAdminOnlyStats(): Promise<AdminDashboardStats> {
    try {
      // Solo obtener datos administrativos (usuarios, áreas, roles)
      const [usuarios, areas, roles] = await Promise.all([
        usersService.getUsuarios(),
        apiService.getAreas(),
        apiService.getRoles()
      ]);

      return {
        totalUsers: usuarios.length,
        totalAreas: areas.length,
        totalRoles: roles.length,
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas administrativas:', error);
      return {
        totalUsers: 0,
        totalAreas: 0,
        totalRoles: 0,
      };
    }
  }

  private async getJornadasData() {
    try {
      // Usar el servicio de jornadas
      const [pendientes, aprobadas] = await Promise.all([
        jornadasService.getJornadasPendientes(),
        jornadasService.getJornadasAprobadas()
      ]);
      
      // Filtrar jornadas de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const jornadasHoy = [...pendientes, ...aprobadas].filter((j: any) => 
        j.fecha && j.fecha.startsWith(hoy)
      ).length;
      
      const jornadasCompletadas = aprobadas.filter((j: any) => 
        j.fecha && j.fecha.startsWith(hoy)
      ).length;

      return {
        jornadasHoy,
        jornadasCompletadas,
        pendientesAprobacion: pendientes.length,
      };
    } catch (error) {
      console.error('Error obteniendo datos de jornadas:', error);
      return {
        jornadasHoy: 0,
        jornadasCompletadas: 0,
        pendientesAprobacion: 0,
      };
    }
  }
}

export const dashboardService = new DashboardService();
