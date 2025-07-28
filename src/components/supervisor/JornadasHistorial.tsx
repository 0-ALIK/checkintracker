// src/components/supervisor/JornadasHistorial.tsx
'use client';

import { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Calendar, 
  Search, 
  RefreshCw, 
  Eye, 
  Filter, 
  ChevronDown, 
  SortAsc, 
  SortDesc,
  FileText,
  Users,
  Activity
} from 'lucide-react';
import { EmployeeJornada, HistorialFilters } from './types';

interface JornadasHistorialProps {
  jornadas: EmployeeJornada[];
  filters: HistorialFilters;
  itemsPerPage: number;
  onFiltersChange: (filters: Partial<HistorialFilters>) => void;
  onResetFilters: () => void;
  onSort: (field: string) => void;
  onViewDetails: (jornada: EmployeeJornada) => void;
  getStatusColor: (status: EmployeeJornada['status']) => string;
  getStatusIcon: (status: EmployeeJornada['status']) => React.ReactNode;
  formatTime: (time: string) => string;
  formatDate: (date: string) => string;
  getUniqueAreas: () => string[];
}

export function JornadasHistorial({
  jornadas,
  filters,
  itemsPerPage,
  onFiltersChange,
  onResetFilters,
  onSort,
  onViewDetails,
  getStatusColor,
  getStatusIcon,
  formatTime,
  formatDate,
  getUniqueAreas
}: JornadasHistorialProps) {
  
  const paginatedData = useMemo(() => {
    // Filtrar
    const filtered = jornadas.filter(jornada => {
      const searchMatch = filters.searchTerm === '' || 
        (jornada.usuario?.nombre?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
         jornada.usuario?.apellido?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
         jornada.usuario?.email?.toLowerCase().includes(filters.searchTerm.toLowerCase()));

      const statusMatch = filters.statusFilter === 'all' || jornada.status === filters.statusFilter;
      const areaMatch = filters.areaFilter === 'all' || jornada.usuario?.area?.nombre_area === filters.areaFilter;

      return searchMatch && statusMatch && areaMatch;
    });

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let valueA: any, valueB: any;

      switch (filters.sortField) {
        case 'empleado':
          valueA = `${a.usuario?.nombre || ''} ${a.usuario?.apellido || ''}`;
          valueB = `${b.usuario?.nombre || ''} ${b.usuario?.apellido || ''}`;
          break;
        case 'area':
          valueA = a.usuario?.area?.nombre_area || '';
          valueB = b.usuario?.area?.nombre_area || '';
          break;
        case 'status':
          valueA = a.status;
          valueB = b.status;
          break;
        case 'fecha':
          valueA = new Date(a.fecha).getTime();
          valueB = new Date(b.fecha).getTime();
          break;
        case 'checkin':
          valueA = new Date(a.hora_checkin).getTime();
          valueB = new Date(b.hora_checkin).getTime();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return filters.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return filters.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginar
    const startIndex = (filters.currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      data: sorted.slice(startIndex, endIndex),
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / itemsPerPage)
    };
  }, [jornadas, filters, itemsPerPage]);

  return (
    <div className="space-y-4">
      {/* Controles de filtrado y búsqueda */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="space-y-2">
          <Label htmlFor="search" className="text-sm font-medium">Buscar empleado</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Nombre, apellido o email..."
              value={filters.searchTerm}
              onChange={(e) => onFiltersChange({ searchTerm: e.target.value, currentPage: 1 })}
              className="pl-8 h-9"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Estado</Label>
          <Select value={filters.statusFilter} onValueChange={(value) => onFiltersChange({ statusFilter: value, currentPage: 1 })}>
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
          <Select value={filters.areaFilter} onValueChange={(value) => onFiltersChange({ areaFilter: value, currentPage: 1 })}>
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
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 flex-1">
                  <Filter className="mr-1 h-3 w-3" />
                  Ordenar
                  <ChevronDown className="ml-1 h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSort('fecha')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Por Fecha
                  {filters.sortField === 'fecha' && (filters.sortDirection === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort('empleado')}>
                  <Users className="mr-2 h-4 w-4" />
                  Por Empleado
                  {filters.sortField === 'empleado' && (filters.sortDirection === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort('area')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Por Área
                  {filters.sortField === 'area' && (filters.sortDirection === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSort('status')}>
                  <Activity className="mr-2 h-4 w-4" />
                  Por Estado
                  {filters.sortField === 'status' && (filters.sortDirection === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onResetFilters}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Limpiar Filtros
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Información de resultados */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando {paginatedData.data.length > 0 ? ((filters.currentPage - 1) * itemsPerPage) + 1 : 0} a {Math.min(filters.currentPage * itemsPerPage, paginatedData.total)} de {paginatedData.total} jornadas
        </span>
        {(filters.searchTerm || filters.statusFilter !== 'all' || filters.areaFilter !== 'all') && (
          <Button variant="ghost" size="sm" onClick={onResetFilters}>
            <RefreshCw className="mr-1 h-3 w-3" />
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla de historial */}
      {paginatedData.data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No se encontraron jornadas</p>
          <p className="text-sm">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <div className="max-h-[350px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('empleado')}
                  >
                    <div className="flex items-center">
                      Empleado
                      {filters.sortField === 'empleado' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('area')}
                  >
                    <div className="flex items-center">
                      Área
                      {filters.sortField === 'area' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('status')}
                  >
                    <div className="flex items-center">
                      Estado
                      {filters.sortField === 'status' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onSort('fecha')}
                  >
                    <div className="flex items-center">
                      Fecha
                      {filters.sortField === 'fecha' && (
                        filters.sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.data.map((jornada) => (
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
                            {jornada.status === 'Pending Approval' && 'Pendiente'}
                            {jornada.status === 'Approved' && 'Aprobado'}
                            {jornada.status === 'Offline' && 'Sin Actividad'}
                          </span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDate(jornada.fecha)}
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
      )}

      {/* Paginación */}
      {paginatedData.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {filters.currentPage} de {paginatedData.totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onFiltersChange({ currentPage: Math.max(1, filters.currentPage - 1) })}
              disabled={filters.currentPage === 1}
            >
              Anterior
            </Button>
            
            {/* Números de página */}
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, paginatedData.totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (paginatedData.totalPages > 5) {
                  if (filters.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (filters.currentPage >= paginatedData.totalPages - 2) {
                    pageNum = paginatedData.totalPages - 4 + i;
                  } else {
                    pageNum = filters.currentPage - 2 + i;
                  }
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={filters.currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => onFiltersChange({ currentPage: pageNum })}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onFiltersChange({ currentPage: Math.min(paginatedData.totalPages, filters.currentPage + 1) })}
              disabled={filters.currentPage === paginatedData.totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
