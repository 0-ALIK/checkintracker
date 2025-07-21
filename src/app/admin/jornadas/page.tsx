"use client";

import { useState, useEffect } from "react";
import { jornadasService } from "@/services/jornadas.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Jornada } from "@/types";
import { JornadaDetails } from "@/components/jornada-details";
import { DashboardHeader } from "@/components/dashboard-header";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export default function JornadasPage() {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJornada, setSelectedJornada] = useState<Jornada | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id_rol === 1) {
      loadJornadas();
    }
  }, [user]);

  const loadJornadas = async () => {
    try {
      setLoading(true);
      const data = await jornadasService.getJornadasPendientes();
      setJornadas(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar jornadas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (jornada: Jornada) => {
    if (window.confirm(`¿Aprobar la jornada de ${jornada.usuario?.nombre} ${jornada.usuario?.apellido}?`)) {
      try {
        setProcessingId(jornada.id_jornada);
        await jornadasService.aprobarJornada(jornada.id_jornada);
        toast({
          title: "Jornada aprobada",
          description: "La jornada ha sido aprobada exitosamente",
        });
        loadJornadas();
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Error al aprobar jornada",
          variant: "destructive",
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleRechazar = async () => {
    if (!selectedJornada || !motivoRechazo.trim()) {
      toast({
        title: "Error",
        description: "Debe proporcionar un motivo para el rechazo",
        variant: "destructive",
      });
      return;
    }

    try {
      setProcessingId(selectedJornada.id_jornada);
      await jornadasService.rechazarJornada(selectedJornada.id_jornada, motivoRechazo);
      toast({
        title: "Jornada rechazada",
        description: "La jornada ha sido rechazada",
      });
      setShowRejectDialog(false);
      setMotivoRechazo("");
      setSelectedJornada(null);
      loadJornadas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al rechazar jornada",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectDialog = (jornada: Jornada) => {
    setSelectedJornada(jornada);
    setMotivoRechazo("");
    setShowRejectDialog(true);
  };

  const openDetailsDialog = (jornada: Jornada) => {
    setSelectedJornada(jornada);
    setShowDetailsDialog(true);
  };

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

  const getStatusBadge = (jornada: Jornada) => {
    if (jornada.aprobado) {
      return <Badge className="bg-green-100 text-green-800">Aprobada</Badge>;
    }
    if (!jornada.hora_checkout) {
      return <Badge variant="secondary">En progreso</Badge>;
    }
    return <Badge variant="outline">Pendiente</Badge>;
  };

  if (user?.id_rol !== 1) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Acceso Denegado</CardTitle>
              <CardDescription>
                No tienes permisos para acceder a esta sección.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Cargando jornadas...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Jornadas Pendientes de Aprobación</CardTitle>
              <CardDescription>
                Revisa y aprueba las jornadas laborales de los empleados
              </CardDescription>
            </div>
            <Button onClick={loadJornadas} variant="outline">
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actividades</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jornadas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No hay jornadas pendientes de aprobación.
                    </TableCell>
                  </TableRow>
                ) : (
                  jornadas.map((jornada) => (
                    <TableRow key={jornada.id_jornada}>
                      <TableCell className="font-medium">
                        {jornada.usuario?.nombre} {jornada.usuario?.apellido}
                        <div className="text-sm text-muted-foreground">
                          {jornada.usuario?.area?.nombre_area}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(jornada.fecha)}</TableCell>
                      <TableCell>{formatTime(jornada.hora_checkin)}</TableCell>
                      <TableCell>
                        {jornada.hora_checkout ? (
                          formatTime(jornada.hora_checkout)
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            En progreso
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(jornada)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {jornada.actividades?.length || 0} actividades
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailsDialog(jornada)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!jornada.aprobado && jornada.hora_checkout && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAprobar(jornada)}
                                disabled={processingId === jornada.id_jornada}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openRejectDialog(jornada)}
                                disabled={processingId === jornada.id_jornada}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para rechazar jornada */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar Jornada</DialogTitle>
            <DialogDescription>
              Proporciona un motivo para rechazar la jornada de{" "}
              {selectedJornada?.usuario?.nombre} {selectedJornada?.usuario?.apellido}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="motivo">Motivo del rechazo</Label>
              <Textarea
                id="motivo"
                placeholder="Explica por qué rechazas esta jornada..."
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleRechazar}
                disabled={!motivoRechazo.trim() || processingId === selectedJornada?.id_jornada}
              >
                Rechazar Jornada
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Jornada</DialogTitle>
            <DialogDescription>
              Información completa de la jornada laboral
            </DialogDescription>
          </DialogHeader>
          {selectedJornada && (
            <JornadaDetails jornada={selectedJornada} showActivities={true} />
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
  );
}
