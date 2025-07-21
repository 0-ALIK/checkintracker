// src/services/api.service.ts
import { 
  LoginDto, 
  LoginResponse, 
  User, 
  Jornada, 
  CheckinDto, 
  CheckoutDto,
  Actividad,
  CreateActividadDto,
  Comentario,
  CreateComentarioDto,
  Rol,
  Area
} from '@/types';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Recuperar token si existe
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  // Método genérico para hacer requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `${this.token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: `Error ${response.status}: ${response.statusText}` 
        }));
        throw new Error(error.message || 'Error en la solicitud');
      }

      // Si es 204 No Content, no intentar parsear
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ============= AUTH METHODS =============
  
  async login(data: LoginDto): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // Guardar token y usuario
    this.token = response.access_token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  logout() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ============= JORNADAS METHODS =============

  async checkin(data: CheckinDto): Promise<Jornada> {
    return this.request<Jornada>('/jornadas/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkout(data: CheckoutDto): Promise<Jornada> {
    return this.request<Jornada>('/jornadas/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMiHistorial(): Promise<Jornada[]> {
    return this.request<Jornada[]>('/jornadas/mi-historial');
  }

  async getJornadasPendientes(): Promise<Jornada[]> {
    return this.request<Jornada[]>('/jornadas/pendientes');
  }

  async getJornadasAprobadas(): Promise<Jornada[]> {
    return this.request<Jornada[]>('/jornadas/aprobadas');
  }

  async getJornadasForSupervisors() {
    return this.request('/jornadas/todas-empleados');
  }

  async getJornadasBySupervisor(supervisorId: number): Promise<Jornada[]> {
    return this.request<Jornada[]>(`/jornadas/supervisor/${supervisorId}`);
  }

  async aprobarJornada(id: number): Promise<Jornada> {
    return this.request<Jornada>(`/jornadas/${id}/aprobar`, {
      method: 'PUT',
    });
  }

  async rechazarJornada(id: number, motivo: string): Promise<Jornada> {
    return this.request<Jornada>(`/jornadas/${id}/rechazar`, {
      method: 'PUT',
      body: JSON.stringify({ motivo }),
    });
  }

  // ============= ACTIVIDADES METHODS =============

  async createActividad(data: CreateActividadDto): Promise<Actividad> {
    return this.request<Actividad>('/actividades', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateActividad(id: number, data: Partial<CreateActividadDto>): Promise<Actividad> {
    return this.request<Actividad>(`/actividades/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getActividadesByJornada(jornadaId: number): Promise<Actividad[]> {
    return this.request<Actividad[]>(`/jornadas/actividades/${jornadaId}`);
  }

  async getActividad(id: number): Promise<Actividad> {
    return this.request<Actividad>(`/actividades/${id}`);
  }

  // ============= COMENTARIOS METHODS =============

  async createComentario(data: CreateComentarioDto): Promise<Comentario> {
    return this.request<Comentario>('/comentarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getComentariosByActividad(actividadId: number): Promise<Comentario[]> {
    return this.request<Comentario[]>(`/comentarios/actividad/${actividadId}`);
  }

  async getComentariosByJornada(jornadaId: number) {
    return this.request(`/comentarios/jornada/${jornadaId}`);
  }

  // ============= USUARIOS METHODS =============

  async getUsuarios(): Promise<User[]> {
    return this.request<User[]>('/usuarios');
  }

  async getUsuario(id: number): Promise<User> {
    return this.request<User>(`/usuarios/${id}`);
  }

  async createUsuario(data: Partial<User> & { contraseña: string }): Promise<User> {
    return this.request<User>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUsuario(id: number, data: Partial<User>): Promise<User> {
    return this.request<User>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUsuario(id: number): Promise<void> {
    return this.request<void>(`/usuarios/${id}`, {
      method: 'DELETE',
    });
  }

  async assignRol(userId: number, rolId: number): Promise<User> {
    return this.request<User>(`/usuarios/${userId}/rol`, {
      method: 'PUT',
      body: JSON.stringify({ id_rol: rolId }),
    });
  }

  async assignArea(userId: number, areaId: number): Promise<User> {
    return this.request<User>(`/usuarios/${userId}/area`, {
      method: 'PUT',
      body: JSON.stringify({ id_area: areaId }),
    });
  }

  // Métodos para roles
  async getRoles(): Promise<Rol[]> {
    return this.request<Rol[]>('/roles');
  }

  // Métodos para áreas
  async getAreas(): Promise<Area[]> {
    return this.request<Area[]>('/areas');
  }

  // ============= SPRINT/TAREAS PENDIENTES METHODS =============

  async getTareasPendientes() {
    return this.request('/jornadas/tareas-pendientes');
  }

  async checkinConTareasPendientes(data: {
    checkinDto: CheckinDto;
    tareasArrastradas: number[];
  }): Promise<Jornada> {
    return this.request<Jornada>('/jornadas/checkin-con-tareas-pendientes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Exportar instancia única
export const apiService = new ApiService();