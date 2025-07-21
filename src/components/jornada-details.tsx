"use client";

import { Jornada } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Clock, CheckCircle, XCircle, User, Calendar, MapPin } from "lucide-react";

interface JornadaDetailsProps {
  jornada: Jornada;
  showActivities?: boolean;
}

export function JornadaDetails({ jornada, showActivities = true }: JornadaDetailsProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd/MM/yyyy", { locale: es });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString: string) => {
    try {
      return format(parseISO(`2000-01-01T${timeString}`), "HH:mm");
    } catch {
      return timeString;
    }
  };

  const getStatusBadge = () => {
    if (jornada.aprobado) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Aprobada
        </Badge>
      );
    }
    if (!jornada.hora_checkout) {
      return (
        <Badge variant="secondary">
          <Clock className="h-3 w-3 mr-1" />
          En progreso
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <XCircle className="h-3 w-3 mr-1" />
        Pendiente
      </Badge>
    );
  };

  const calculateWorkingHours = () => {
    if (!jornada.hora_checkout) return "En progreso";
    
    try {
      const checkinTime = parseISO(`2000-01-01T${jornada.hora_checkin}`);
      const checkoutTime = parseISO(`2000-01-01T${jornada.hora_checkout}`);
      const diffInMinutes = (checkoutTime.getTime() - checkinTime.getTime()) / (1000 * 60);
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      
      return `${hours}h ${minutes}m`;
    } catch {
      return "Error calculando";
    }
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Empleado
          </Label>
          <div className="text-sm">
            <p className="font-medium">
              {jornada.usuario?.nombre} {jornada.usuario?.apellido}
            </p>
            <p className="text-muted-foreground">{jornada.usuario?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Área
          </Label>
          <p className="text-sm">{jornada.usuario?.area?.nombre_area || "No asignada"}</p>
        </div>

        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fecha
          </Label>
          <p className="text-sm font-medium">{formatDate(jornada.fecha)}</p>
        </div>

        <div className="space-y-2">
          <Label>Estado</Label>
          <div>{getStatusBadge()}</div>
        </div>
      </div>

      {/* Horarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Label className="text-xs text-muted-foreground">Check-in</Label>
          <p className="text-lg font-bold text-blue-600">
            {formatTime(jornada.hora_checkin)}
          </p>
        </div>
        
        <div className="text-center">
          <Label className="text-xs text-muted-foreground">Check-out</Label>
          <p className="text-lg font-bold text-red-600">
            {jornada.hora_checkout ? formatTime(jornada.hora_checkout) : "En progreso"}
          </p>
        </div>
        
        <div className="text-center">
          <Label className="text-xs text-muted-foreground">Tiempo Total</Label>
          <p className="text-lg font-bold text-green-600">
            {calculateWorkingHours()}
          </p>
        </div>
      </div>

      {/* Observaciones */}
      {jornada.observaciones && (
        <div className="space-y-2">
          <Label>Observaciones</Label>
          <div className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            {jornada.observaciones}
          </div>
        </div>
      )}

      {/* Actividades */}
      {showActivities && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Actividades</Label>
            <Badge variant="outline">
              {jornada.actividades?.length || 0} registradas
            </Badge>
          </div>
          
          {jornada.actividades && jornada.actividades.length > 0 ? (
            <div className="space-y-3">
              {jornada.actividades.map((actividad, index) => (
                <div key={actividad.id} className="border rounded-lg p-4 bg-white">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          Actividad #{index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {actividad.estado?.nombre_estado || "Sin estado"}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-sm">{actividad.tarea}</h4>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    <strong>Meta:</strong> {actividad.meta}
                  </div>
                  
                  {actividad.observaciones && (
                    <div className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                      <strong>Observaciones:</strong> {actividad.observaciones}
                    </div>
                  )}

                  {actividad.comentarios && actividad.comentarios.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-xs">Comentarios del supervisor</Label>
                      {actividad.comentarios.map((comentario) => (
                        <div key={comentario.id} className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-400">
                          <p className="text-sm">{comentario.comentario}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {comentario.supervisor?.nombre} {comentario.supervisor?.apellido} - {formatDate(comentario.fecha_comentario)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay actividades registradas para esta jornada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
