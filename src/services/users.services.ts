import { User } from '@/types';

class UsersService {
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
}

export const usersService = new UsersService();