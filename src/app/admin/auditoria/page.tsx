'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Search, Calendar, User, Activity, Filter } from 'lucide-react';
import { apiService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface AuditoriaRecord {
  id: number;
  id_usuario: number;
  accion: string;
  fecha: string;
  descripcion: string;
  usuario?: {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
  };
}

export default function AuditoriaPage() {
  const [auditoria, setAuditoria] = useState<AuditoriaRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadAuditoria();
  }, []);

  const loadAuditoria = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAuditorias() as AuditoriaRecord[];
      setAuditoria(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al cargar registros de auditoría",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const buscarPorFechas = async () => {
    if (!fechaInicio || !fechaFin) {
      toast({
        title: "Error",
        description: "Debe seleccionar fecha de inicio y fin",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.getAuditoriasPorFecha(fechaInicio, fechaFin) as AuditoriaRecord[];
      setAuditoria(data);
      toast({
        title: "Búsqueda completada",
        description: `Se encontraron ${data.length} registros`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al buscar por fechas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAuditoria = auditoria.filter(record => 
    record.accion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.usuario?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.usuario?.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.usuario?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getAccionColor = (accion: string) => {
    if (accion.includes('LOGIN')) return 'text-blue-600 bg-blue-50';
    if (accion.includes('CREATE') || accion.includes('CREAR')) return 'text-green-600 bg-green-50';
    if (accion.includes('UPDATE') || accion.includes('ACTUALIZAR')) return 'text-orange-600 bg-orange-50';
    if (accion.includes('DELETE') || accion.includes('ELIMINAR')) return 'text-red-600 bg-red-50';
    if (accion.includes('CRON')) return 'text-purple-600 bg-purple-50';
    if (accion.includes('LIMPIEZA')) return 'text-gray-600 bg-gray-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Panel de Admin
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Registros de Auditoría</h1>
          <p className="text-muted-foreground">
            Historial completo de actividades del sistema
          </p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por acción, detalles, usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                placeholder="Fecha inicio"
              />
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                placeholder="Fecha fin"
              />
              <Button onClick={buscarPorFechas} disabled={loading}>
                <Calendar className="h-4 w-4 mr-2" />
                Buscar
              </Button>
              <Button variant="outline" onClick={loadAuditoria} disabled={loading}>
                Todos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold">{auditoria.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Filtrados</p>
                <p className="text-2xl font-bold">{filteredAuditoria.length}</p>
              </div>
              <Search className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Hoy</p>
                <p className="text-2xl font-bold">
                  {auditoria.filter(r => 
                    new Date(r.fecha).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de registros */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Actividad</CardTitle>
          <CardDescription>
            {filteredAuditoria.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="flex justify-between items-start mb-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
              ))}
            </div>
          ) : filteredAuditoria.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No se encontraron registros de auditoría</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredAuditoria.map((record) => (
                <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAccionColor(record.accion)}`}>
                        {record.accion}
                      </span>
                      {record.usuario && (
                        <span className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {record.usuario.nombre} {record.usuario.apellido}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatFecha(record.fecha)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{record.descripcion}</p>
                  {record.usuario && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {record.usuario.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
