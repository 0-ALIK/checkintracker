// src/components/employee-view.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LogIn, LogOut, FileText, CheckCircle, Clock, Plus, Calendar, MessageSquare, Eye, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api.service';
import { Jornada, Actividad, User, TareaPendiente } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

export function EmployeeView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentJornada, setCurrentJornada] = useState<Jornada | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [checkoutObservations, setCheckoutObservations] = useState('');
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tareasPendientes, setTareasPendientes] = useState<TareaPendiente[]>([]);
  const [tareasSeleccionadas, setTareasSeleccionadas] = useState<number[]>([]);
  
  // Estados para vista centralizada de comentarios
  const [showAllCommentsDialog, setShowAllCommentsDialog] = useState(false);
  const [allComentarios, setAllComentarios] = useState<any[]>([]);
  const [loadingAllComentarios, setLoadingAllComentarios] = useState(false);
  const [selectedActivityForComment, setSelectedActivityForComment] = useState<number | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // Form de checkin con tareas
  const [checkinForm, setCheckinForm] = useState({
    tarea1: '',
    tarea2: '',
    tarea3: '',
    comentario: ''
  });

  // Cargar jornada actual al montar componente
  useEffect(() => {
    checkCurrentJornada();
    loadTareasPendientes();
    
    // Actualizar cada 30 segundos si hay una jornada activa (reducido de 10 segundos)
    const interval = setInterval(() => {
      if (isCheckedIn && document.visibilityState === 'visible') {
        checkCurrentJornada();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isCheckedIn]);

  // Actualizar tiempo transcurrido cada segundo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCheckedIn && currentJornada) {
      interval = setInterval(() => {
        const start = new Date(currentJornada.hora_checkin);
        const now = new Date();
        const diff = now.getTime() - start.getTime();
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setElapsedTime(
          `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCheckedIn, currentJornada]);

  const checkCurrentJornada = async () => {
    try {
      const historial = await apiService.getMiHistorial();
      const today_date = new Date();
      const today = today_date.getFullYear() + '-' + 
                   String(today_date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(today_date.getDate()).padStart(2, '0');
      const todayJornada = historial.find(j => 
        j.fecha.split('T')[0] === today && !j.hora_checkout
      );
      
      if (todayJornada) {
        const wasApproved = currentJornada?.aprobado;
        setCurrentJornada(todayJornada);
        setIsCheckedIn(true);
        const time = new Date(todayJornada.hora_checkin).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        setCheckInTime(time);
        
        // Cargar actividades de la jornada
        const acts = await apiService.getActividadesByJornada(todayJornada.id_jornada);
        setActividades(acts);
        
        // Mostrar notificación si se aprobó la jornada
        if (!wasApproved && todayJornada.aprobado) {
          toast({
            title: "¡Jornada Aprobada!",
            description: "Tu supervisor ha aprobado tu jornada. Ya puedes gestionar tus actividades.",
          });
        }
      } else {
        // Si no hay jornada activa, resetear estado
        if (isCheckedIn) {
          setIsCheckedIn(false);
          setCurrentJornada(null);
          setActividades([]);
          setElapsedTime('00:00:00');
        }
      }
    } catch (error) {
      console.error('Error checking jornada:', error);
    }
  };

  const loadTareasPendientes = async () => {
    try {
      const pendientes = await apiService.getTareasPendientes() as TareaPendiente[];
      setTareasPendientes(pendientes);
    } catch (error) {
      console.error('Error loading tareas pendientes:', error);
    }
  };

  const openCommentsView = async () => {
    if (!currentJornada) return;
    
    setShowAllCommentsDialog(true);
    setLoadingAllComentarios(true);
    
    try {
      const comentariosData = await apiService.getComentariosByJornada(currentJornada.id_jornada);
      setAllComentarios(comentariosData as any[]);
    } catch (error) {
      console.error('Error loading comentarios:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los comentarios",
        variant: "destructive",
      });
    } finally {
      setLoadingAllComentarios(false);
    }
  };

  const handleAddCommentFromDialog = async () => {
    if (!selectedActivityForComment || !newComment.trim()) return;
    
    try {
      await apiService.createComentario({
        id_actividad: selectedActivityForComment,
        comentario: newComment
      });
      
      toast({
        title: "Comentario agregado",
        description: "Tu comentario se guardó correctamente",
      });
      
      setNewComment('');
      setSelectedActivityForComment(null);
      
      // Recargar comentarios
      if (currentJornada) {
        const comentariosData = await apiService.getComentariosByJornada(currentJornada.id_jornada);
        setAllComentarios(comentariosData as any[]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;
    
    // Calcular cuántas tareas nuevas necesitamos (máximo 3 total)
    const tareasContinuadasCount = tareasSeleccionadas.length;
    const tareasNuevasRequeridas = Math.max(0, 3 - tareasContinuadasCount);
    
    // Validar que tengamos exactamente 3 tareas (entre continuadas y nuevas)
    const tareasNuevasCompletas = [checkinForm.tarea1, checkinForm.tarea2, checkinForm.tarea3]
      .slice(0, tareasNuevasRequeridas)
      .filter(tarea => tarea.trim() !== '');
    
    if (tareasContinuadasCount + tareasNuevasCompletas.length !== 3) {
      toast({
        title: "Error",
        description: `Debes tener exactamente 3 tareas. Tienes ${tareasContinuadasCount} continuadas y necesitas ${tareasNuevasRequeridas} nuevas.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Preparar las tareas nuevas solo las que necesitamos
      const tareasNuevas = [];
      if (tareasNuevasRequeridas >= 1 && checkinForm.tarea1) {
        tareasNuevas.push({ tarea: checkinForm.tarea1, meta: "Tarea planificada 1" });
      }
      if (tareasNuevasRequeridas >= 2 && checkinForm.tarea2) {
        tareasNuevas.push({ tarea: checkinForm.tarea2, meta: "Tarea planificada 2" });
      }
      if (tareasNuevasRequeridas >= 3 && checkinForm.tarea3) {
        tareasNuevas.push({ tarea: checkinForm.tarea3, meta: "Tarea planificada 3" });
      }

      const checkinData = {
        fecha: new Date().toISOString(),
        comentario: checkinForm.comentario,
        tareas: tareasNuevas
      };

      let jornada;
      if (tareasSeleccionadas.length > 0) {
        // Usar checkin con tareas pendientes
        jornada = await apiService.checkinConTareasPendientes({
          checkinDto: checkinData,
          tareasArrastradas: tareasSeleccionadas
        });
      } else {
        // Usar checkin normal
        jornada = await apiService.checkin(checkinData);
      }
      
      setCurrentJornada(jornada);
      setIsCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      
      // Limpiar formularios
      setCheckinForm({
        tarea1: '',
        tarea2: '',
        tarea3: '',
        comentario: ''
      });
      setTareasSeleccionadas([]);
      setShowCheckinDialog(false);
      
      // Cargar actividades creadas
      const acts = await apiService.getActividadesByJornada(jornada.id_jornada);
      setActividades(acts);
      
      toast({
        title: "Jornada iniciada",
        description: "Tu jornada de trabajo ha comenzado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al iniciar jornada",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTareaPendienteToggle = (tareaId: number, checked: boolean) => {
    if (checked) {
      setTareasSeleccionadas(prev => [...prev, tareaId]);
    } else {
      setTareasSeleccionadas(prev => prev.filter(id => id !== tareaId));
    }
  };

  const updateActividadEstado = async (actividadId: number, nuevoEstado: number) => {
    try {
      await apiService.updateActividad(actividadId, { id_estado: nuevoEstado });
      
      // Actualizar estado local
      setActividades(actividades.map(act => 
        act.id === actividadId ? { ...act, id_estado: nuevoEstado } : act
      ));
      
      toast({
        title: "Estado actualizado",
        description: "El estado de la actividad se actualizó correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const addComentarioActividad = async (actividadId: number, comentario: string) => {
    try {
      await apiService.createComentario({
        id_actividad: actividadId,
        comentario: comentario
      });
      
      toast({
        title: "Comentario agregado",
        description: "Tu comentario se guardó correctamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el comentario",
        variant: "destructive",
      });
    }
  };

  const handleCheckOut = async () => {
    if (!currentJornada) return;
    
    setIsLoading(true);
    try {
      await apiService.checkout({
        id_jornada: currentJornada.id_jornada,
        observaciones: checkoutObservations
      });
      
      setShowCheckoutDialog(false);
      setIsCheckedIn(false);
      setCurrentJornada(null);
      setCheckoutObservations('');
      setActividades([]);
      setElapsedTime('00:00:00');
      
      toast({
        title: "Jornada finalizada",
        description: "Tu jornada de trabajo ha terminado correctamente",
      });
      
      // Recargar para actualizar el historial
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error al finalizar jornada",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="h-full shadow-lg transition-shadow hover:shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Clock className="h-6 w-6 text-primary" />
              Control de Tiempo
            </CardTitle>
            <CardDescription>Gestiona tu jornada laboral</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
            {isCheckedIn ? (
              <>
                <div className="space-y-2">
                <p className="text-lg font-semibold text-[hsl(var(--chart-2))]">
                    Jornada en progreso
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Entrada: {checkInTime}
                  </p>
                  <div className="text-2xl font-mono font-bold text-primary">
                    {elapsedTime}
                  </div>
                </div>
                
                <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      size="lg" 
                      className="w-full font-bold"
                      disabled={isLoading}
                    >
                      <LogOut className="mr-2 h-5 w-5" />
                      Check Out
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle className="font-headline">Finalizar Jornada</DialogTitle>
                      <DialogDescription>
                        Agrega observaciones finales sobre tu jornada de trabajo antes de cerrarla.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid w-full gap-2">
                        <Label htmlFor="observations">Observaciones de la Jornada (Opcional)</Label>
                        <Textarea 
                          id="observations" 
                          placeholder="Logros del día, clientes contactados, ventas realizadas, tareas que quedan pendientes..."
                          value={checkoutObservations}
                          onChange={(e) => setCheckoutObservations(e.target.value)}
                          rows={4}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancelar</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleCheckOut} 
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Finalizando Jornada...' : 'Finalizar Jornada'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground">
                  Jornada no iniciada
                </p>
                
                <Dialog open={showCheckinDialog} onOpenChange={setShowCheckinDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg" 
                      className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Iniciar Jornada
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="font-headline">Iniciar Jornada de Trabajo</DialogTitle>
                      <DialogDescription>
                        Selecciona tareas pendientes de jornadas anteriores y/o planifica nuevas tareas (máximo 3 total)
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                      
                      {/* Sección de Tareas Pendientes */}
                      {tareasPendientes.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="h-px bg-border flex-1" />
                            <Label className="text-sm font-semibold text-muted-foreground">
                              📋 Tareas Pendientes de Jornadas Anteriores
                            </Label>
                            <div className="h-px bg-border flex-1" />
                          </div>
                          
                          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                            <p className="text-sm text-muted-foreground">
                              Selecciona las tareas que quieres continuar en esta jornada:
                            </p>
                            {tareasPendientes.map((tarea) => (
                              <div key={tarea.id} className="flex items-start space-x-3 p-3 bg-background rounded border">
                                <Checkbox 
                                  id={`tarea-${tarea.id}`}
                                  checked={tareasSeleccionadas.includes(tarea.id)}
                                  onCheckedChange={(checked) => 
                                    handleTareaPendienteToggle(tarea.id, checked as boolean)
                                  }
                                  disabled={tareasSeleccionadas.length >= 3 && !tareasSeleccionadas.includes(tarea.id)}
                                />
                                <div className="flex-1 space-y-1">
                                  <label 
                                    htmlFor={`tarea-${tarea.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {tarea.tarea}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">Meta:</span> {tarea.meta}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">De:</span> {' '}
                                    {new Date(tarea.fecha_origen).toLocaleDateString('es-ES')}
                                  </p>
                                  {tarea.observaciones && (
                                    <p className="text-xs italic text-muted-foreground">
                                      "{tarea.observaciones}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                            
                            {tareasSeleccionadas.length > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <span className="font-medium text-blue-800">
                                  ✓ {tareasSeleccionadas.length} tarea(s) seleccionada(s). 
                                  Necesitas {Math.max(0, 3 - tareasSeleccionadas.length)} tarea(s) nueva(s).
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sección de Nuevas Tareas */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-px bg-border flex-1" />
                          <Label className="text-sm font-semibold text-muted-foreground">
                            ✨ Nuevas Tareas para esta Jornada
                          </Label>
                          <div className="h-px bg-border flex-1" />
                        </div>

                        {/* Mostrar campos de tarea según las que faltan */}
                        {Array.from({ length: Math.max(0, 3 - tareasSeleccionadas.length) }, (_, index) => {
                          const tareaKey = `tarea${index + 1}` as keyof typeof checkinForm;
                          const isRequired = tareasSeleccionadas.length + index < 3;
                          
                          return (
                            <div key={index} className="grid gap-2">
                              <Label htmlFor={tareaKey}>
                                Nueva Tarea {index + 1} {isRequired ? '*' : '(Opcional)'}
                              </Label>
                              <Input
                                id={tareaKey}
                                placeholder={`¿Cuál es tu ${index === 0 ? 'primera' : index === 1 ? 'segunda' : 'tercera'} tarea nueva?`}
                                value={checkinForm[tareaKey]}
                                onChange={(e) => setCheckinForm({...checkinForm, [tareaKey]: e.target.value})}
                              />
                            </div>
                          );
                        })}

                        {tareasSeleccionadas.length === 3 && (
                          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                            ✓ Jornada completa con 3 tareas continuadas. No necesitas agregar tareas nuevas.
                          </div>
                        )}
                      </div>
                      
                      {/* Comentario general */}
                      <div className="grid gap-2">
                        <Label htmlFor="comentario">Comentario de la Jornada (Opcional)</Label>
                        <Textarea
                          id="comentario"
                          placeholder="Observaciones generales del día, objetivos de ventas..."
                          value={checkinForm.comentario}
                          onChange={(e) => setCheckinForm({...checkinForm, comentario: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancelar</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleCheckIn}
                        disabled={isLoading || (tareasSeleccionadas.length + 
                          [checkinForm.tarea1, checkinForm.tarea2, checkinForm.tarea3]
                            .slice(0, Math.max(0, 3 - tareasSeleccionadas.length))
                            .filter(t => t.trim()).length) !== 3}
                      >
                        {isLoading ? 'Iniciando Jornada...' : 'Iniciar Jornada'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="shadow-lg transition-shadow hover:shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Actividades del Día
                </CardTitle>
                <CardDescription>
                  Gestiona el estado y progreso de tus tareas de ventas
                </CardDescription>
              </div>
              {isCheckedIn && currentJornada && (
                <Button 
                  variant="outline" 
                  onClick={() => openCommentsView()}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Ver Todos los Comentarios
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isCheckedIn ? (
              <div className="space-y-4">
                {actividades.length > 0 ? (
                  actividades.map((actividad) => (
                    <ActividadCard 
                      key={actividad.id} 
                      actividad={actividad}
                      jornadaAprobada={currentJornada?.aprobado || false}
                      currentJornada={currentJornada}
                      onUpdateEstado={updateActividadEstado}
                      onAddComentario={addComentarioActividad}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay actividades registradas</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Inicia tu jornada para gestionar tus actividades</p>
                <p className="text-sm mt-2">Podrás continuar tareas pendientes de jornadas anteriores</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="lg:col-span-3">
        <Card className="shadow-lg transition-shadow hover:shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Calendar className="h-6 w-6 text-primary" />
              Historial de Jornadas
            </CardTitle>
            <CardDescription>
              Tus últimas jornadas de trabajo y su estado de aprobación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JornadaHistory />
          </CardContent>
        </Card>
      </div>

      {/* Diálogo centralizado para ver todos los comentarios de la jornada */}
      <Dialog open={showAllCommentsDialog} onOpenChange={setShowAllCommentsDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Comentarios de la Jornada
            </DialogTitle>
            <DialogDescription>
              Todos los comentarios organizados por actividad - {currentJornada && new Date(currentJornada.fecha).toLocaleDateString('es-ES')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {loadingAllComentarios ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-muted-foreground">Cargando comentarios...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {actividades.map((actividad) => {
                  const comentariosActividad = allComentarios.filter(c => c.id_actividad === actividad.id);
                  
                  return (
                    <div key={actividad.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h4 className="font-semibold text-lg flex items-center gap-2">
                            {actividad.tarea}
                            {actividad.es_arrastrada && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                🔄 Continuada
                              </Badge>
                            )}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Meta:</span> {actividad.meta}
                          </p>
                        </div>
                        <Badge className={
                          actividad.id_estado === 1 ? 'bg-gray-100 text-gray-800' :
                          actividad.id_estado === 2 ? 'bg-yellow-100 text-yellow-800' :
                          actividad.id_estado === 3 ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {actividad.id_estado === 1 ? 'Pendiente' :
                           actividad.id_estado === 2 ? 'En Progreso' :
                           actividad.id_estado === 3 ? 'Completada' : 'Cancelada'}
                        </Badge>
                      </div>
                      
                      {comentariosActividad.length > 0 ? (
                        <div className="space-y-3 max-h-[200px] overflow-y-auto">
                          {comentariosActividad.map((comentario, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                                    <span className="text-xs font-medium text-primary">
                                      {comentario.usuario?.nombre?.charAt(0) || 'U'}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      {comentario.usuario?.nombre} {comentario.usuario?.apellido}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {comentario.usuario?.rol?.nombre || 'Usuario'}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comentario.fecha_comentario).toLocaleString('es-ES', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <p className="text-sm bg-white p-2 rounded border-l-4 border-primary/20">
                                {comentario.comentario}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No hay comentarios para esta actividad</p>
                        </div>
                      )}
                      
                      {/* Área para agregar comentario a esta actividad específica */}
                      {currentJornada?.aprobado && !currentJornada?.hora_checkout && (
                        <div className="mt-3 pt-3 border-t space-y-2">
                          {selectedActivityForComment === actividad.id ? (
                            <div className="space-y-2">
                              <Textarea
                                placeholder={`Agregar comentario para: ${actividad.tarea}`}
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                rows={2}
                              />
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedActivityForComment(null);
                                    setNewComment('');
                                  }}
                                >
                                  Cancelar
                                </Button>
                                <Button 
                                  onClick={handleAddCommentFromDialog} 
                                  disabled={!newComment.trim()}
                                  size="sm"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Agregar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedActivityForComment(actividad.id)}
                              className="w-full"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Agregar comentario a esta actividad
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {actividades.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay actividades en esta jornada</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente para mostrar cada actividad
function ActividadCard({ 
  actividad, 
  jornadaAprobada,
  currentJornada,
  onUpdateEstado, 
  onAddComentario 
}: {
  actividad: Actividad;
  jornadaAprobada: boolean;
  currentJornada: Jornada | null;
  onUpdateEstado: (id: number, estado: number) => void;
  onAddComentario: (id: number, comentario: string) => void;
}) {
  const getEstadoColor = (estadoId: number) => {
    switch (estadoId) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoNombre = (estadoId: number) => {
    switch (estadoId) {
      case 1: return 'Pendiente';
      case 2: return 'En Progreso';
      case 3: return 'Completada';
      case 4: return 'Cancelada';
      default: return 'Pendiente';
    }
  };

  return (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold text-lg">{actividad.tarea}</h4>
            {actividad.es_arrastrada && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                🔄 Continuada
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Meta:</span> {actividad.meta}
          </p>
          {actividad.observaciones && (
            <p className="text-sm mt-2 italic">
              "{actividad.observaciones}"
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getEstadoColor(actividad.id_estado)}>
            {getEstadoNombre(actividad.id_estado)}
          </Badge>
          
          {/* Solo permitir edición si la jornada está aprobada Y no se ha hecho checkout */}
          {jornadaAprobada && !currentJornada?.hora_checkout ? (
            <Select
              value={actividad.id_estado.toString()}
              onValueChange={(value) => onUpdateEstado(actividad.id, parseInt(value))}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Pendiente</SelectItem>
                <SelectItem value="2">En Progreso</SelectItem>
                <SelectItem value="3">Completada</SelectItem>
                <SelectItem value="4">Cancelada</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Badge variant="outline" className="text-xs">
              {!jornadaAprobada ? 'Esperando aprobación' : 'Jornada finalizada'}
            </Badge>
          )}
        </div>
      </div>
      
      {/* Mensaje informativo si no está aprobada */}
      {!jornadaAprobada && (
        <div className="mt-3 pt-3 border-t">
          <p className="text-xs text-muted-foreground italic">
            💡 Podrás gestionar esta tarea después de que tu supervisor apruebe el inicio de la jornada
          </p>
        </div>
      )}
    </div>
  );
}

// Componente auxiliar para mostrar historial
function JornadaHistory() {
  const [historial, setHistorial] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJornada, setSelectedJornada] = useState<Jornada | null>(null);
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [showJornadaDialog, setShowJornadaDialog] = useState(false);
  const [loadingActividades, setLoadingActividades] = useState(false);

  useEffect(() => {
    loadHistorial();
  }, []);

  const loadHistorial = async () => {
    try {
      const data = await apiService.getMiHistorial();
      // Filtrar jornadas completadas (con checkout) y ordenar por fecha descendente
      const completedJornadas = data
        .filter(j => j.hora_checkout)
        .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        .slice(0, 10); // Últimas 10 jornadas
      setHistorial(completedJornadas);
    } catch (error) {
      console.error('Error loading historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJornadaDetails = async (jornada: Jornada) => {
    setSelectedJornada(jornada);
    setShowJornadaDialog(true);
    setLoadingActividades(true);
    
    try {
      // Cargar actividades y comentarios
      const [acts, comments] = await Promise.all([
        apiService.getActividadesByJornada(jornada.id_jornada),
        apiService.getComentariosByJornada(jornada.id_jornada)
      ]);
      setActividades(acts);
      setComentarios(comments as any[]);
    } catch (error) {
      console.error('Error loading jornada details:', error);
    } finally {
      setLoadingActividades(false);
    }
  };

  const calculateDuration = (checkin: string, checkout: string) => {
    const start = new Date(checkin);
    const end = new Date(checkout);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const getEstadoColor = (estadoId: number) => {
    switch (estadoId) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-yellow-100 text-yellow-800';
      case 3: return 'bg-green-100 text-green-800';
      case 4: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoNombre = (estadoId: number) => {
    switch (estadoId) {
      case 1: return 'Pendiente';
      case 2: return 'En Progreso';
      case 3: return 'Completada';
      case 4: return 'Cancelada';
      default: return 'Pendiente';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  if (historial.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No tienes jornadas completadas aún</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {historial.map((jornada) => (
          <div key={jornada.id_jornada} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex-1 space-y-1">
              <p className="font-medium">
                {new Date(jornada.fecha).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  {new Date(jornada.hora_checkin).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                  {' - '}
                  {new Date(jornada.hora_checkout!).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
                <span>•</span>
                <span>
                  Duración: {calculateDuration(jornada.hora_checkin, jornada.hora_checkout!)}
                </span>
              </div>
              {jornada.observaciones && (
                <p className="text-sm italic mt-1">"{jornada.observaciones}"</p>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={
                jornada.aprobado 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }>
                {jornada.aprobado ? 'Aprobada' : 'Pendiente'}
              </Badge>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => loadJornadaDetails(jornada)}
              >
                <FileText className="mr-1 h-3 w-3" />
                Ver Actividades
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Dialog para mostrar detalles de la jornada */}
      <Dialog open={showJornadaDialog} onOpenChange={setShowJornadaDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          {selectedJornada && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Detalles de Jornada - {formatDate(selectedJornada.fecha)}
                </DialogTitle>
                <DialogDescription>
                  Revisa las actividades realizadas y su progreso
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Información básica de la jornada */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Información de la Jornada</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Check-in:</span>
                        <span>{formatTime(selectedJornada.hora_checkin)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Check-out:</span>
                        <span>{selectedJornada.hora_checkout ? formatTime(selectedJornada.hora_checkout) : 'No registrado'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Duración:</span>
                        <span>
                          {selectedJornada.hora_checkout 
                            ? calculateDuration(selectedJornada.hora_checkin, selectedJornada.hora_checkout)
                            : 'En curso'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Estado:</span>
                        <Badge className={
                          selectedJornada.aprobado 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }>
                          {selectedJornada.aprobado ? 'Aprobada' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                    
                    {selectedJornada.observaciones && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="font-medium mb-2">Observaciones:</p>
                        <p className="text-sm italic">"{selectedJornada.observaciones}"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actividades realizadas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Actividades Realizadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingActividades ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-2 text-sm text-muted-foreground">Cargando actividades...</p>
                      </div>
                    ) : actividades.length > 0 ? (
                      <div className="space-y-4">
                        {actividades.map((actividad, index) => (
                          <div key={actividad.id} className="border rounded-lg p-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <span className="bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                                      #{index + 1}
                                    </span>
                                    {actividad.tarea}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <span className="font-medium">Meta:</span> {actividad.meta}
                                  </p>
                                  {actividad.observaciones && (
                                    <p className="text-sm mt-2 italic bg-secondary/50 p-2 rounded">
                                      "{actividad.observaciones}"
                                    </p>
                                  )}
                                </div>
                                <Badge className={getEstadoColor(actividad.id_estado)}>
                                  {getEstadoNombre(actividad.id_estado)}
                                </Badge>
                              </div>

                              {/* Comentarios de la actividad */}
                              {comentarios.filter(c => c.id_actividad === actividad.id).length > 0 && (
                                <div className="mt-3 pt-3 border-t bg-muted/30 rounded p-3">
                                  <p className="text-xs font-medium mb-2 flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" />
                                    Comentarios:
                                  </p>
                                  <div className="space-y-2">
                                    {comentarios
                                      .filter(c => c.id_actividad === actividad.id)
                                      .sort((a, b) => new Date(b.fecha_comentario).getTime() - new Date(a.fecha_comentario).getTime())
                                      .map((comentario) => (
                                      <div key={comentario.id} className="text-xs bg-background border rounded p-2">
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="font-medium">
                                            {comentario.usuario.nombre} {comentario.usuario.apellido}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {new Date(comentario.fecha_comentario).toLocaleString('es-ES')}
                                          </span>
                                        </div>
                                        <p>{comentario.comentario}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Resumen de actividades */}
                        <div className="mt-6 p-4 bg-secondary/30 rounded-lg">
                          <h4 className="font-medium mb-2">Resumen de Actividades</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-lg">{actividades.length}</div>
                              <div className="text-muted-foreground">Total</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg text-green-600">
                                {actividades.filter(a => a.id_estado === 3).length}
                              </div>
                              <div className="text-muted-foreground">Completadas</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg text-yellow-600">
                                {actividades.filter(a => a.id_estado === 2).length}
                              </div>
                              <div className="text-muted-foreground">En Progreso</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-lg text-gray-600">
                                {actividades.filter(a => a.id_estado === 1).length}
                              </div>
                              <div className="text-muted-foreground">Pendientes</div>
                            </div>
                          </div>
                          
                          {actividades.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Progreso General:</span>
                                <span className="text-sm font-bold">
                                  {Math.round((actividades.filter(a => a.id_estado === 3).length / actividades.length) * 100)}%
                                </span>
                              </div>
                              <div className="w-full bg-secondary rounded-full h-2 mt-1">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                                  style={{ 
                                    width: `${(actividades.filter(a => a.id_estado === 3).length / actividades.length) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No se registraron actividades en esta jornada</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cerrar</Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}