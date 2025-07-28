// src/components/supervisor/JornadasToday.tsx
'use client';

import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Search, RefreshCw, Eye } from 'lucide-react';
import { EmployeeJornada, JornadaFilters } from './types';

interface JornadasTodayProps {
  jornadas: EmployeeJornada[];
  filters: JornadaFilters;
  onFiltersChange: (filters: Partial<JornadaFilters>) => void;
  onResetFilters: () => void;
  onViewDetails: (jornada: EmployeeJornada) => void;
  getStatusColor: (status: EmployeeJornada['status']) => string;
  getStatusIcon: (status: EmployeeJornada['status']) => React.ReactNode;
  formatTime: (time: string) => string;
  getUniqueAreas: () => string[];
}

export function JornadasToday({
  jornadas,
  filters,
  onFiltersChange,
  onResetFilters,
  onViewDetails,
  getStatusColor,
  getStatusIcon,
  formatTime,
  getUniqueAreas
}: JornadasTodayProps) {
  
  const filteredJornadas = useMemo(() => {
    return jornadas.filter(jornada => {
      const searchMatch = filters.searchTerm === '' || 
        (jornada.usuario?.nombre?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
         jornada.usuario?.apellido?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
         jornada.usuario?.email?.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      const statusMatch = filters.statusFilter === 'all' || jornada.status === filters.statusFilter;
      const areaMatch = filters.areaFilter === 'all' || jornada.usuario?.area?.nombre_area === filters.areaFilter;

      return searchMatch && statusMatch && areaMatch;
    });
  }, [jornadas, filters]);

  if (jornadas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">No hay jornadas registradas hoy</p>
        <p className="text-sm">Los empleados pueden iniciar sus jornadas desde la aplicación</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Métricas rápidas del día */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-yellow-800">
            {filteredJornadas.filter(j => j.status === 'Pending Approval').length}
          </div>
          <div className="text-xs text-yellow-700">Pendientes</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-800">
            {filteredJornadas.filter(j => j.status === 'Online').length}
          </div>
          <div className="text-xs text-green-700">Trabajando</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-800">
            {filteredJornadas.filter(j => j.status === 'Approved').length}
          </div>
          <div className="text-xs text-blue-700">Completadas</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-gray-800">
            {filteredJornadas.filter(j => j.status === 'Offline').length}
          </div>
          <div className="text-xs text-gray-700">Sin Actividad</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="searchToday" className="text-sm font-medium">Buscar empleado</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="searchToday"
              placeholder="Nombre, apellido o email..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Estado</Label>
          <Select value={filters.statusFilter} onValueChange={(value) => onFiltersChange({ statusFilter: value })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="Pending Approval">Pendiente Aprobación</SelectItem>
              <SelectItem value="Online">Trabajando</SelectItem>
              <SelectItem value="Approved">Aprobado</SelectItem>
              <SelectItem value="Offline">Sin Actividad</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Área</Label>
          <Select value={filters.areaFilter} onValueChange={(value) => onFiltersChange({ areaFilter: value })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las áreas</SelectItem>
              {getUniqueAreas().map(area => (
                <SelectItem key={area} value={area}>{area}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Acciones</Label>
          <Button variant="outline" size="sm" className="h-9 w-full" onClick={onResetFilters}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Limpiar Filtros
          </Button>
        </div>
      </div>

      {/* Información de resultados */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {filteredJornadas.length} de {jornadas.length} jornadas de hoy
        </span>
        {(filters.searchTerm || filters.statusFilter !== 'all' || filters.areaFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla de jornadas */}
      <div className="rounded-md border">
        <div className={`${filteredJornadas.length > 6 ? 'max-h-[400px] overflow-y-auto' : ''}`}>
          <Table>
            <TableHeader className={`${filteredJornadas.length > 6 ? 'sticky top-0 bg-background z-10' : ''}`}>
              <TableRow>
                <TableHead>Empleado</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Check-in</TableHead>
                <TableHead>Check-out</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredJornadas.map((jornada) => (
                <TableRow key={jornada.id_jornada} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 flex-shrink-0">
                        <span className="text-xs font-medium text-primary">
                          {jornada.usuario ? `${jornada.usuario.nombre.charAt(0)}${jornada.usuario.apellido.charAt(0)}` : 'U'}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">
                          {jornada.usuario ? `${jornada.usuario.nombre} ${jornada.usuario.apellido}` : 'Usuario Desconocido'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{jornada.usuario?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {jornada.usuario?.area?.nombre_area || 'No asignada'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${getStatusColor(jornada.status)} text-white text-xs`}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(jornada.status)}
                        <span className="hidden sm:inline">
                          {jornada.status === 'Online' && 'Trabajando'}
                          {jornada.status === 'Pending Approval' && (jornada.hora_checkout ? 'Check-out Pendiente' : 'Check-in Pendiente')}
                          {jornada.status === 'Approved' && 'Completada'}
                          {jornada.status === 'Offline' && 'Sin Actividad'}
                        </span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{formatTime(jornada.hora_checkin)}</TableCell>
                  <TableCell className="font-mono text-sm">
                    {jornada.hora_checkout ? formatTime(jornada.hora_checkout) : (
                      <span className="text-muted-foreground italic">En curso</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(jornada)}
                      className="h-7 px-2"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
