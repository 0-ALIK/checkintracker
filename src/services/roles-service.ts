import { Rol } from '@/types';

class RolesService {
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
      ...(this.token && { Authorization: this.token }),
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

  async getRoles(): Promise<Rol[]> {
    return this.request<Rol[]>('/roles');
  }

  async getRol(id: number): Promise<Rol> {
    return this.request<Rol>(`/roles/${id}`);
  }

  async createRol(data: { nombre_rol: string }): Promise<Rol> {
    return this.request<Rol>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRol(id: number, data: { nombre_rol: string }): Promise<Rol> {
    return this.request<Rol>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRol(id: number): Promise<void> {
    return this.request<void>(`/roles/${id}`, {
      method: 'DELETE',
    });
  }
}

export const rolesService = new RolesService();
