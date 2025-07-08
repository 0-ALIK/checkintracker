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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, ThumbsUp, ThumbsDown, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
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
    // Recargar cada 30 segundos
    const interval = setInterval(loadJornadas, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadJornadas = async () => {
    if (!user) return;
    
    try {
      const data = await apiService.getJornadasBySupervisor(user.id);
      
      // Procesar jornadas para determinar estado
      const processedJornadas = data.map(j => {
        let status: EmployeeJornada['status'] = 'Offline';
        
        if (!j.hora_checkout) {
          status = 'Online';
        } else if (j.aprobado) {
          status = 'Approved';
        } else {
          status = 'Pending Approval';
        }
        
        return { ...j, status };
      });
      
      // Ordenar: Online primero, luego Pending, luego el resto
      processedJornadas.sort((a, b) => {
        const statusOrder = { 'Online': 0, 'Pending Approval': 1, 'Approved': 2, 'Offline': 3 };
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
      // Cargar actividades
      const acts = await apiService.getActividadesByJornada(jornada.id_jornada);
      setActividades(acts);
      
      // Cargar comentarios
      const comments = await apiService.getComentariosByJornada(jornada.id_jornada);
      setComentarios(comments);
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
        title: "Jornada aprobada",
        description: "La jornada ha sido aprobada exitosamente",
      });
      
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
        description: "Tu comentario se ha guardado",
      });
      
      setNewComment('');
      setSelectedActivityId(null);
      
      // Recargar comentarios
      if (selectedJornada) {
        const comments = await apiService.getComentariosByJornada(selectedJornada.id_jornada);
        setComentarios(comments);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'Online':
        return 'bg-[hsl(var(--chart-2))] text-primary-foreground';
      case 'Pending Approval':
        return 'bg-[hsl(var(--chart-4))] text-accent-foreground';
      case 'Approved':
        return 'bg-primary text-primary-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
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
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="shadow-lg transition-shadow hover:shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline">Jornadas del Equipo</CardTitle>
        <CardDescription>
          Revisa y gestiona las jornadas laborales de tu equipo
        </CardDescription>
      </CardHeader>
      <CardContent>
        {jornadas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay jornadas asignadas a tu supervisión</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Empleado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jornadas.map((jornada) => (
                <TableRow key={jornada.id_jornada}>
                  <TableCell>
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src="https://placehold.co/100x100.png" alt={jornada.usuario?.nombre} />
                        <AvatarFallback>
                          {jornada.usuario ? 
                            `${jornada.usuario.nombre.charAt(0)}${jornada.usuario.apellido.charAt(0)}` : 
                            'U'
                          }
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">
                        {jornada.usuario ? 
                          `${jornada.usuario.nombre} ${jornada.usuario.apellido}` : 
                          'Usuario'
                        }
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusClass(jornada.status)}>
                      {jornada.status === 'Online' && <Clock className="mr-1 h-3 w-3" />}
                      {jornada.status === 'Approved' && <CheckCircle className="mr-1 h-3 w-3" />}
                      {jornada.status === 'Pending Approval' && <XCircle className="mr-1 h-3 w-3" />}
                      {jornada.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatTime(jornada.hora_checkin)}</TableCell>
                  <TableCell>
                    {jornada.hora_checkout ? formatTime(jornada.hora_checkout) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
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
        )}

        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-headline text-2xl">
                Jornada de {selectedJornada?.usuario?.nombre} {selectedJornada?.usuario?.apellido}
              </SheetTitle>
              <SheetDescription>
                {selectedJornada && formatDate(selectedJornada.fecha)}
              </SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            
            <div className="space-y-6 py-4">
              <div>
                <h4 className="font-headline text-lg mb-2">Horario</h4>
                <div className="space-y-1">
                  <p><strong>Check-in:</strong> {selectedJornada && formatTime(selectedJornada.hora_checkin)}</p>
                  <p><strong>Check-out:</strong> {selectedJornada?.hora_checkout ? formatTime(selectedJornada.hora_checkout) : 'En curso'}</p>
                </div>
              </div>

              {selectedJornada?.observaciones && (
                <div>
                  <h4 className="font-headline text-lg mb-2">Observaciones del Empleado</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {selectedJornada.observaciones}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-headline text-lg mb-2">Actividades Realizadas</h4>
                {actividades.length > 0 ? (
                  <div className="space-y-3">
                    {actividades.map((actividad) => (
                      <div key={actividad.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{actividad.tarea}</p>
                            <p className="text-sm text-muted-foreground">Meta: {actividad.meta}</p>
                            {actividad.observaciones && (
                              <p className="text-sm italic mt-1">{actividad.observaciones}</p>
                            )}
                          </div>
                          <Badge variant="outline">
                            {actividad.id_estado === 3 ? 'Completada' : 
                             actividad.id_estado === 2 ? 'En Progreso' : 'Pendiente'}
                          </Badge>
                        </div>
                        
                        {/* Comentarios de la actividad */}
                        {comentarios.filter(c => c.id_actividad === actividad.id).length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs font-medium mb-1">Comentarios:</p>
                            {comentarios
                              .filter(c => c.id_actividad === actividad.id)
                              .map(c => (
                                <div key={c.id} className="text-xs bg-secondary p-2 rounded mt-1">
                                  <p>{c.comentario}</p>
                                  <p className="text-muted-foreground mt-1">
                                    - {c.supervisor?.nombre} {c.supervisor?.apellido}
                                  </p>
                                </div>
                              ))
                            }
                          </div>
                        )}
                        
                        {selectedJornada && !selectedJornada.aprobado && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => setSelectedActivityId(
                              selectedActivityId === actividad.id ? null : actividad.id
                            )}
                          >
                            <MessageSquare className="mr-1 h-3 w-3" />
                            Comentar
                          </Button>
                        )}
                        
                        {selectedActivityId === actividad.id && (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              placeholder="Escribe un comentario..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleAddComment}>
                                Enviar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedActivityId(null);
                                  setNewComment('');
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No se registraron actividades</p>
                )}
              </div>
            </div>

            {selectedJornada && !selectedJornada.aprobado && selectedJornada.hora_checkout && (
              <SheetFooter className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                <SheetClose asChild>
                  <Button variant="ghost">Cerrar</Button>
                </SheetClose>
                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="destructive"
                    onClick={handleReject}
                    disabled={isProcessing}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4"/>
                    Rechazar
                  </Button>
                  <Button 
                    className="bg-[hsl(var(--chart-2))] hover:bg-[hsl(var(--chart-2))]/90 text-primary-foreground"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4"/>
                    Aprobar
                  </Button>
                </div>
              </SheetFooter>
            )}
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}