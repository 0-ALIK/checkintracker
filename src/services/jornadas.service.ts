import { Jornada } from '@/types';

class JornadasService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  private getAuthHeaders() {
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

  async getJornadasPendientes(): Promise<Jornada[]> {
    return this.request<Jornada[]>('/jornadas/pendientes');
  }

  async getJornadasAprobadas(): Promise<Jornada[]> {
    return this.request<Jornada[]>('/jornadas/aprobadas');
  }

  async getJornadasBySupervisor(supervisorId: number): Promise<Jornada[]> {
    return this.request<Jornada[]>(`/jornadas/supervisor/${supervisorId}`);
  }

  async getMiHistorial(): Promise<Jornada[]> {
    return this.request<Jornada[]>('/jornadas/mi-historial');
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

  async checkin(data: { id_supervisor: number; fecha: string }): Promise<Jornada> {
    return this.request<Jornada>('/jornadas/checkin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkout(data: { id_jornada: number; observaciones?: string }): Promise<Jornada> {
    return this.request<Jornada>('/jornadas/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const jornadasService = new JornadasService();
