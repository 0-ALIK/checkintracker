// src/components/supervisor-view.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api.service';
import { Jornada, Actividad, Comentario } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface EmployeeJornada extends Jornada {
  status: 'Online' | 'Offline' | 'Pending Approval' | 'Approved';
}

export function SupervisorView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jornadas, setJornadas] = useState<EmployeeJornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJornada, setSelectedJornada] = useState<Jornada | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [newComment, setNewComment] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadJornadas();
    // Actualizar cada 15 segundos
    const interval = setInterval(loadJornadas, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const loadJornadas = async () => {
    if (!user) return;
    
    try {
      const data = await apiService.getJornadasForSupervisors();
      
      const processedJornadas = data.map((j: any) => {
        let status: EmployeeJornada['status'] = 'Offline';
        
        if (!j.hora_checkout && !j.aprobado) {
          status = 'Pending Approval'; // Check-in pendiente
        } else if (!j.hora_checkout && j.aprobado) {
          status = 'Online'; // Trabajando (check-in aprobado, sin checkout)
        } else if (j.hora_checkout && !j.aprobado) {
          status = 'Pending Approval'; // Check-out pendiente de aprobación
        } else if (j.hora_checkout && j.aprobado) {
          status = 'Approved'; // Jornada completamente aprobada
        }
        
        return { ...j, status };
      });
      
      // Ordenar por prioridad
      processedJornadas.sort((a, b) => {
        const statusOrder = { 
          'Pending Approval': 0, // Prioridad máxima
          'Online': 1,           // Trabajando
          'Approved': 2,         // Completados
          'Offline': 3           // Sin actividad
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });
      
      setJornadas(processedJornadas);
    } catch (error) {
      console.error('Error loading jornadas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las jornadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadJornadaDetails = async (jornada: Jornada) => {
    setSelectedJornada(jornada);
    setSheetOpen(true);
    
    try {
      // Cargar actividades y comentarios
      const [acts, comments] = await Promise.all([
        apiService.getActividadesByJornada(jornada.id_jornada),
        apiService.getComentariosByJornada(jornada.id_jornada)
      ]);
      setActividades(acts);
      setComentarios(comments as Comentario[]);
    } catch (error) {
      console.error('Error loading details:', error);
    }
  };

  const handleApprove = async () => {
    if (!selectedJornada) return;
    
    setIsProcessing(true);
    try {
      await apiService.aprobarJornada(selectedJornada.id_jornada);
      
      toast({
        title: selectedJornada.hora_checkout ? "Checkout aprobado" : "Checkin aprobado",
        description: selectedJornada.hora_checkout 
          ? "El checkout ha sido aprobado exitosamente" 
          : "El checkin ha sido aprobado. El empleado puede gestionar sus tareas.",
      });
      
      // Actualizar la jornada seleccionada
      setSelectedJornada(prev => prev ? { ...prev, aprobado: true } : null);
      setSheetOpen(false);
      loadJornadas();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo aprobar la jornada",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedJornada || !newComment) {
      toast({
        title: "Error",
        description: "Debes agregar un motivo para rechazar",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await apiService.rechazarJornada(selectedJornada.id_jornada, newComment);
      
      toast({
        title: "Jornada rechazada",
        description: "La jornada ha sido rechazada",
      });
      
      setSheetOpen(false);
      setNewComment('');
      loadJornadas();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo rechazar la jornada",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedActivityId || !newComment) return;
    
    try {
      await apiService.createComentario({
        id_actividad: selectedActivityId,
        comentario: newComment
      });
      
      toast({
        title: "Comentario agregado",
        description: "El comentario se ha guardado correctamente",
      });
      
      setNewComment('');
      setSelectedActivityId(null);
      
      // Recargar comentarios
      const comments = await apiService.getComentariosByJornada(selectedJornada!.id_jornada);
      setComentarios(comments as Comentario[]);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: EmployeeJornada['status']) => {
    switch (status) {
      case 'Online':
        return 'bg-green-500';
      case 'Pending Approval':
        return 'bg-yellow-500';
      case 'Approved':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: EmployeeJornada['status']) => {
    switch (status) {
      case 'Online':
        return <Clock className="h-4 w-4" />;
      case 'Pending Approval':
        return <Clock className="h-4 w-4" />; // Cambiar Timer por Clock
      case 'Approved':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />; // Cambiar User por Users
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Cargando jornadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Panel de Supervisión</h2>
          <p className="text-muted-foreground">
            Revisa y gestiona las jornadas laborales de todos los empleados
          </p>
        </div>
      </div>

      {jornadas.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No hay jornadas de empleados registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jornadas.map((jornada) => (
                <TableRow key={jornada.id_jornada}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        <span className="text-sm font-medium">
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
                  </TableCell>
                  <TableCell>
                    {jornada.usuario?.area?.nombre_area || 'No asignada'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusColor(jornada.status)} text-white`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(jornada.status)}
                        <span>
                          {jornada.status === 'Online' && 'Trabajando'}
                          {jornada.status === 'Pending Approval' && (jornada.hora_checkout ? 'Check-out Pendiente' : 'Check-in Pendiente')}
                          {jornada.status === 'Approved' && 'Aprobado'}
                          {jornada.status === 'Offline' && 'Desconectado'}
                        </span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(jornada.fecha)}</TableCell>
                  <TableCell>{formatTime(jornada.hora_checkin)}</TableCell>
                  <TableCell>
                    {jornada.hora_checkout ? formatTime(jornada.hora_checkout) : 'En curso'}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => loadJornadaDetails(jornada)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Ver Detalles
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet para ver detalles */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto">
          {selectedJornada && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {selectedJornada.usuario?.nombre} {selectedJornada.usuario?.apellido}
                  </span>
                </SheetTitle>
                <SheetDescription>
                  Detalles de la jornada del {formatDate(selectedJornada.fecha)}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Información básica */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información de la Jornada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Check-in:</span>
                      <span>{formatTime(selectedJornada.hora_checkin)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Check-out:</span>
                      <span>{selectedJornada.hora_checkout ? formatTime(selectedJornada.hora_checkout) : 'En curso'}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Observaciones del empleado */}
                {selectedJornada.observaciones && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Observaciones del Empleado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedJornada.observaciones}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Actividades */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actividades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actividades.length > 0 ? (
                      <div className="space-y-3">
                        {actividades.map((actividad) => (
                          <div key={actividad.id} className="border rounded-lg p-3">
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-medium">{actividad.tarea}</h4>
                                <p className="text-sm text-muted-foreground">{actividad.meta}</p>
                                {actividad.observaciones && (
                                  <p className="text-sm italic mt-1">{actividad.observaciones}</p>
                                )}
                                <Badge variant="outline" className="mt-1">
                                  {actividad.id_estado === 3 ? 'Completada' : 
                                   actividad.id_estado === 2 ? 'En Progreso' : 'Pendiente'}
                                </Badge>
                              </div>

                              {/* Comentarios existentes */}
                              {comentarios.filter(c => c.id_actividad === actividad.id).length > 0 && (
                                <div className="mt-2 pt-2 border-t">
                                  <p className="text-xs font-medium mb-1">Comentarios:</p>
                                  {comentarios.filter(c => c.id_actividad === actividad.id).map((c) => (
                                    <div key={c.id} className="text-xs bg-secondary p-2 rounded mt-1">
                                      <p className="font-medium">
                                        {c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : 'Usuario'}:
                                      </p>
                                      <p>{c.comentario}</p>
                                      <p className="text-muted-foreground">
                                        {new Date(c.fecha_comentario).toLocaleString('es-ES')}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Agregar comentario - Mejorar UX */}
                              {selectedActivityId === actividad.id ? (
                                <div className="mt-2 space-y-2">
                                  <Label htmlFor="comment">Comentario del supervisor:</Label>
                                  <Textarea
                                    id="comment"
                                    placeholder="Escribe feedback sobre esta tarea específica..."
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    rows={3}
                                  />
                                  <div className="flex space-x-2">
                                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                                      <MessageSquare className="mr-1 h-3 w-3" />
                                      Agregar Comentario
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => {
                                      setSelectedActivityId(null);
                                      setNewComment('');
                                    }}>
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedActivityId(actividad.id)}
                                >
                                  <MessageSquare className="mr-1 h-3 w-3" />
                                  Comentar Tarea
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No se registraron actividades</p>
                    )}
                  </CardContent>
                </Card>

                {/* Acciones de aprobación - Mostrar solo si está pendiente */}
                {(selectedJornada as EmployeeJornada).status === 'Pending Approval' && !selectedJornada.aprobado && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        {!selectedJornada.hora_checkout 
                          ? 'Aprobar Check-in' 
                          : 'Aprobar Check-out'
                        }
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          {!selectedJornada.hora_checkout 
                            ? 'El empleado podrá gestionar sus tareas después de la aprobación del check-in.'
                            : 'Revisa las actividades completadas antes de aprobar el check-out.'
                          }
                        </p>
                        
                        <Button 
                          onClick={handleApprove} 
                          disabled={isProcessing}
                          className="w-full"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {isProcessing 
                            ? 'Procesando...' 
                            : (!selectedJornada.hora_checkout ? 'Aprobar Check-in' : 'Aprobar Check-out')
                          }
                        </Button>
                      </div>

                      <div className="space-y-2">
                        <Textarea
                          placeholder={`Motivo de rechazo del ${!selectedJornada.hora_checkout ? 'check-in' : 'check-out'} (opcional para aprobar, requerido para rechazar)...`}
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                        />
                        <Button 
                          variant="destructive" 
                          onClick={handleReject}
                          disabled={isProcessing}
                          className="w-full"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {isProcessing ? 'Procesando...' : 'Rechazar'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setSheetOpen(false)}>
                    Cerrar
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}