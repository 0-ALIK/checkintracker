// src/components/supervisor/types.ts

export interface EmployeeJornada {
  id_jornada: number;
  id_usuario?: number;
  fecha: string;
  hora_checkin: string;
  hora_checkout?: string;
  aprobado: boolean;
  observaciones?: string;
  status: 'Online' | 'Offline' | 'Pending Approval' | 'Approved';
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    area?: {
      nombre_area: string;
    };
  };
  actividades?: Array<{
    id: number;
    id_jornada: number;
    tarea: string;
    meta: string;
    id_estado: number;
    observaciones?: string;
    es_arrastrada: boolean;
    id_actividad_origen?: number | null;
    estado?: {
      id: number;
      nombre_estado: string;
    };
    comentarios?: Array<{
      comentario: string;
      fecha_comentario?: string;
      usuario?: {
        nombre: string;
        apellido: string;
      };
    }>;
  }>;
  comentarios?: Array<{
    comentario: string;
    fecha_comentario: string;
    tipo_comentario?: string;
    usuario?: {
      nombre: string;
      apellido: string;
    };
  }>;
}

export interface JornadaFilters {
  searchTerm: string;
  statusFilter: string;
  areaFilter: string;
}

export interface HistorialFilters extends JornadaFilters {
  sortField: string;
  sortDirection: 'asc' | 'desc';
  currentPage: number;
}

export interface ProgressFilters {
  currentPage: number;
  itemsPerPage: number;
}
