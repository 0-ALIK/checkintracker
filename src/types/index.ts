// src/types/index.ts

// Auth types
export interface LoginDto {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  id_area: number;
  id_rol: number;
  area?: Area;
  rol?: Rol;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

// Catalog types
export interface Area {
  id: number;
  nombre_area: string;
}

export interface Rol {
  id: number;
  nombre_rol: string;
}

export interface Estado {
  id: number;
  nombre_estado: string;
}

// Jornada types
export interface Jornada {
  id_jornada: number;
  fecha: string;
  hora_checkin: string;
  hora_checkout?: string;
  observaciones?: string;
  aprobado: boolean;
  id_usuario: number;
  id_supervisor: number;
  usuario?: User;
  supervisor?: User;
  actividades?: Actividad[];
}

export interface CheckinDto {
  fecha: string;
  comentario?: string;
  tareas: {
    tarea: string;
    meta: string;
    observaciones?: string;
  }[];
}

export interface CheckoutDto {
  id_jornada: number;
  observaciones?: string;
}

// Actividad types
export interface Actividad {
  id: number;
  id_jornada: number;
  tarea: string;
  meta: string;
  id_estado: number;
  observaciones?: string;
  es_arrastrada?: boolean; // Si la tarea fue arrastrada de una jornada anterior
  id_actividad_origen?: number; // ID de la actividad original si es arrastrada
  estado?: Estado;
  comentarios?: Comentario[];
}

export interface CreateActividadDto {
  id_jornada: number;
  tarea: string;
  meta: string;
  id_estado: number;
  observaciones?: string;
}

// Sprint/Tareas pendientes types
export interface TareaPendiente {
  id: number;
  tarea: string;
  meta: string;
  observaciones?: string;
  fecha_origen: string;
}

// Comentario types
export interface Comentario {
  id: number;
  id_actividad: number;
  id_usuario: number;
  comentario: string;
  fecha_comentario: string;
  usuario?: User;
}

export interface CreateComentarioDto {
  id_actividad: number;
  comentario: string;
}