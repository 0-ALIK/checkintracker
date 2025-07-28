// src/components/supervisor/JornadaDetails.tsx
'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar,
  Clock,
  User,
  MapPin,
  MessageSquare,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Timer
} from 'lucide-react';
import { EmployeeJornada } from './types';

interface JornadaDetailsProps {
  jornada: EmployeeJornada | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  getStatusColor: (status: EmployeeJornada['status']) => string;
  getStatusIcon: (status: EmployeeJornada['status']) => React.ReactNode;
  formatTime: (time: string) => string;
  formatDate: (date: string) => string;
  formatDuration: (startTime: string, endTime?: string) => string;
}

export function JornadaDetails({
  jornada,
  isOpen,
  onOpenChange,
  getStatusColor,
  getStatusIcon,
  formatTime,
  formatDate,
  formatDuration
}: JornadaDetailsProps) {
  if (!jornada) return null;

  const duration = formatDuration(jornada.hora_checkin, jornada.hora_checkout);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[96vh] flex flex-col z-[60]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Detalles de Jornada</span>
          </DialogTitle>
          <DialogDescription>
            Información completa de la jornada del empleado
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-6 pl-6 pt-4 pb-6">
          <div className="space-y-6">
            {/* Información del empleado */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <User className="mr-2 h-5 w-5" />
                Información del Empleado
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <span className="font-medium text-primary">
                        {jornada.usuario ? `${jornada.usuario.nombre.charAt(0)}${jornada.usuario.apellido.charAt(0)}` : 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">
                        {jornada.usuario ? `${jornada.usuario.nombre} ${jornada.usuario.apellido}` : 'Usuario Desconocido'}
                      </p>
                      <p className="text-sm text-muted-foreground">{jornada.usuario?.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Área:</span>
                    <Badge variant="outline">
                      {jornada.usuario?.area?.nombre_area || 'No asignada'}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Estado:</span>
                    <Badge variant="secondary" className={`${getStatusColor(jornada.status)} text-white`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(jornada.status)}
                        <span>
                          {jornada.status === 'Online' && 'Trabajando'}
                          {jornada.status === 'Pending Approval' && 'Pendiente Aprobación'}
                          {jornada.status === 'Approved' && 'Aprobado'}
                          {jornada.status === 'Offline' && 'Sin Actividad'}
                        </span>
                      </div>
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información de la jornada */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Información de la Jornada
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Fecha:</span>
                    </div>
                    <span className="font-mono">{formatDate(jornada.fecha)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Check-in:</span>
                    </div>
                    <span className="font-mono">{formatTime(jornada.hora_checkin)}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {jornada.hora_checkout ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                      )}
                      <span className="text-sm font-medium">Check-out:</span>
                    </div>
                    <span className="font-mono">
                      {jornada.hora_checkout ? formatTime(jornada.hora_checkout) : (
                        <span className="text-muted-foreground italic">En curso</span>
                      )}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Duración:</span>
                    </div>
                    <span className="font-mono font-semibold">{duration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actividades realizadas */}
            {jornada.actividades && jornada.actividades.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <Activity className="mr-2 h-5 w-5" />
                    Actividades Realizadas ({jornada.actividades.length})
                  </h3>
                  
                  <div className="space-y-6">
                    {jornada.actividades.map((actividad, index) => (
                      <div key={actividad.id || index} className="flex items-start space-x-3 p-5 bg-muted/30 rounded-lg border">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-medium mt-0.5 flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-base">{actividad.tarea}</p>
                            <Badge 
                              variant={actividad.estado?.nombre_estado === 'Completada' ? 'default' : 'secondary'} 
                              className={actividad.estado?.nombre_estado === 'Completada' ? 'bg-green-500 hover:bg-green-600' : ''}
                            >
                              {actividad.estado?.nombre_estado || 'Sin estado'}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground">{actividad.meta}</p>
                          
                          {actividad.observaciones && (
                            <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded border-l-4 border-blue-300 dark:border-blue-700">
                              <span className="font-medium text-blue-700 dark:text-blue-300 text-sm">Observaciones: </span>
                              <span className="text-sm">{actividad.observaciones}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>ID: {actividad.id}</span>
                            {actividad.es_arrastrada && (
                              <Badge variant="outline" className="text-xs">
                                <Activity className="w-3 h-3 mr-1" />
                                Arrastrada
                              </Badge>
                            )}
                            {actividad.id_actividad_origen && (
                              <span>Origen: {actividad.id_actividad_origen}</span>
                            )}
                          </div>
                          
                          {actividad.comentarios && actividad.comentarios.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-muted/50">
                              <p className="text-sm font-medium text-muted-foreground mb-3">
                                💬 Comentarios ({actividad.comentarios.length}):
                              </p>
                              <div className="max-h-40 overflow-y-auto space-y-3 pr-2">
                                {actividad.comentarios.map((comentario, commentIndex) => (
                                  <div key={commentIndex} className="text-sm bg-secondary/30 p-3 rounded-md border">
                                    {comentario.comentario}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Comentarios */}
            {jornada.comentarios && jornada.comentarios.length > 0 && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center">
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Comentarios ({jornada.comentarios.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {jornada.comentarios.map((comentario, index) => (
                      <div key={index} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">
                            {comentario.usuario ? `${comentario.usuario.nombre} ${comentario.usuario.apellido}` : 'Usuario'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(comentario.fecha_comentario)} - {formatTime(comentario.fecha_comentario)}
                          </span>
                        </div>
                        <p className="text-sm">{comentario.comentario}</p>
                        {comentario.tipo_comentario && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {comentario.tipo_comentario}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Información adicional */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Información Adicional</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID de Jornada:</span>
                    <span className="font-mono">{jornada.id_jornada}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID de Usuario:</span>
                    <span className="font-mono">{jornada.id_usuario || jornada.usuario?.id}</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {jornada.observaciones && (
                    <div>
                      <span className="text-muted-foreground">Observaciones:</span>
                      <p className="mt-1 p-2 bg-muted/30 rounded text-sm">{jornada.observaciones}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 px-6 pb-4 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
