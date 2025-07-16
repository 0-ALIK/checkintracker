// src/components/employee-view.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { LogIn, LogOut, FileText, CheckCircle, Clock, Plus, Calendar } from 'lucide-react';
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
import { Jornada, Actividad, User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function EmployeeView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentJornada, setCurrentJornada] = useState<Jornada | null>(null);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showActivityDialog, setShowActivityDialog] = useState(false);
  const [checkoutObservations, setCheckoutObservations] = useState('');
  const [actividades, setActividades] = useState<Actividad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supervisores, setSupervisores] = useState<User[]>([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState<number | null>(null);
  
  // Form de actividad
  const [actividadForm, setActividadForm] = useState({
    tarea: '',
    meta: '',
    id_estado: 1,
    observaciones: ''
  });

  // Cargar supervisores y jornada actual al montar componente
  useEffect(() => {
    loadSupervisores();
    checkCurrentJornada();
  }, []);

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

  const loadSupervisores = async () => {
    try {
      const usuarios = await apiService.getUsuarios();
      const sups = usuarios.filter(u => u.id_rol === 2); // Solo supervisores
      setSupervisores(sups);
      
      // Si hay supervisores, seleccionar el primero por defecto
      if (sups.length > 0) {
        setSelectedSupervisor(sups[0].id);
      }
    } catch (error) {
      console.error('Error loading supervisores:', error);
    }
  };

  const checkCurrentJornada = async () => {
    try {
      const historial = await apiService.getMiHistorial();
      const today = new Date().toISOString().split('T')[0];
      const todayJornada = historial.find(j => 
        j.fecha.split('T')[0] === today && !j.hora_checkout
      );
      
      if (todayJornada) {
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
      }
    } catch (error) {
      console.error('Error checking jornada:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user || !selectedSupervisor) {
      toast({
        title: "Error",
        description: "Debes seleccionar un supervisor",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const jornada = await apiService.checkin({
        id_supervisor: selectedSupervisor,
        fecha: new Date().toISOString()
      });
      
      setCurrentJornada(jornada);
      setIsCheckedIn(true);
      setCheckInTime(new Date().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }));
      
      toast({
        title: "Check-in exitoso",
        description: "Tu jornada ha iniciado correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al hacer check-in",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
        title: "Check-out exitoso",
        description: "Tu jornada ha finalizado correctamente",
      });
      
      // Recargar para actualizar el historial
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error al hacer check-out",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateActividad = async () => {
    if (!currentJornada || !actividadForm.tarea || !actividadForm.meta) return;
    
    setIsLoading(true);
    try {
      const nuevaActividad = await apiService.createActividad({
        id_jornada: currentJornada.id_jornada,
        ...actividadForm
      });
      
      setActividades([...actividades, nuevaActividad]);
      setShowActivityDialog(false);
      setActividadForm({
        tarea: '',
        meta: '',
        id_estado: 1,
        observaciones: ''
      });
      
      toast({
        title: "Actividad creada",
        description: "La actividad se registró correctamente",
      });
    } catch (error) {
      toast({
        title: "Error al crear actividad",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                    Estás en tu jornada
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
                        Agrega observaciones finales antes de cerrar tu jornada.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid w-full gap-2">
                        <Label htmlFor="observations">Observaciones (Opcional)</Label>
                        <Textarea 
                          id="observations" 
                          placeholder="Logros, problemas encontrados, tareas pendientes..."
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
                        {isLoading ? 'Procesando...' : 'Finalizar Jornada'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted-foreground">
                  No has iniciado tu jornada
                </p>
                
                {supervisores.length > 0 && (
                  <div className="w-full space-y-2">
                    <Label>Supervisor</Label>
                    <Select
                      value={selectedSupervisor?.toString()}
                      onValueChange={(value) => setSelectedSupervisor(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona supervisor" />
                      </SelectTrigger>
                      <SelectContent>
                        {supervisores.map((sup) => (
                          <SelectItem key={sup.id} value={sup.id.toString()}>
                            {sup.nombre} {sup.apellido}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <Button 
                  onClick={handleCheckIn} 
                  size="lg" 
                  className="w-full font-bold bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isLoading || !selectedSupervisor}
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  {isLoading ? 'Procesando...' : 'Check In'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="shadow-lg transition-shadow hover:shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Actividades del Día
            </CardTitle>
            <CardDescription>
              Registra tus tareas y objetivos diarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isCheckedIn ? (
              <div className="space-y-4">
                {/* Lista de actividades */}
                <div className="space-y-3">
                  {actividades.length > 0 ? (
                    actividades.map((actividad) => (
                      <div key={actividad.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold text-lg">{actividad.tarea}</h4>
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Meta:</span> {actividad.meta}
                            </p>
                            {actividad.observaciones && (
                              <p className="text-sm mt-2 italic">
                                "{actividad.observaciones}"
                              </p>
                            )}
                          </div>
                          <Badge className={getEstadoColor(actividad.id_estado)}>
                            {getEstadoNombre(actividad.id_estado)}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No has registrado actividades aún</p>
                      <p className="text-sm">Haz clic en el botón para agregar tu primera actividad</p>
                    </div>
                  )}
                </div>

                {/* Botón para agregar actividad */}
                <Dialog open={showActivityDialog} onOpenChange={setShowActivityDialog}>
                  <DialogTrigger asChild>
                    <Button className="w-full" size="lg">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar Actividad
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Registrar Actividad</DialogTitle>
                      <DialogDescription>
                        Agrega una nueva actividad a tu jornada actual
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="tarea">Tarea*</Label>
                        <Input
                          id="tarea"
                          placeholder="¿En qué trabajaste?"
                          value={actividadForm.tarea}
                          onChange={(e) => setActividadForm({...actividadForm, tarea: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="meta">Meta/Objetivo*</Label>
                        <Input
                          id="meta"
                          placeholder="¿Cuál era el objetivo?"
                          value={actividadForm.meta}
                          onChange={(e) => setActividadForm({...actividadForm, meta: e.target.value})}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="estado">Estado</Label>
                        <Select
                          value={actividadForm.id_estado.toString()}
                          onValueChange={(value) => setActividadForm({...actividadForm, id_estado: parseInt(value)})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Pendiente</SelectItem>
                            <SelectItem value="2">En Progreso</SelectItem>
                            <SelectItem value="3">Completada</SelectItem>
                            <SelectItem value="4">Cancelada</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="observaciones">Observaciones (Opcional)</Label>
                        <Textarea
                          id="observaciones"
                          placeholder="Notas adicionales, bloqueos, etc..."
                          value={actividadForm.observaciones}
                          onChange={(e) => setActividadForm({...actividadForm, observaciones: e.target.value})}
                          rows={3}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="ghost">Cancelar</Button>
                      </DialogClose>
                      <Button 
                        onClick={handleCreateActividad}
                        disabled={isLoading || !actividadForm.tarea || !actividadForm.meta}
                      >
                        {isLoading ? 'Guardando...' : 'Guardar Actividad'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Inicia tu jornada para registrar actividades</p>
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
              Historial Reciente
            </CardTitle>
            <CardDescription>
              Tus últimas jornadas y su estado de aprobación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <JornadaHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente auxiliar para mostrar historial
function JornadaHistory() {
  const [historial, setHistorial] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);

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

  const calculateDuration = (checkin: string, checkout: string) => {
    const start = new Date(checkin);
    const end = new Date(checkout);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
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
    <div className="space-y-3">
      {historial.map((jornada) => (
        <div key={jornada.id_jornada} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
          <div className="space-y-1">
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
          <Badge className={
            jornada.aprobado 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }>
            {jornada.aprobado ? 'Aprobada' : 'Pendiente'}
          </Badge>
        </div>
      ))}
    </div>
  );
}