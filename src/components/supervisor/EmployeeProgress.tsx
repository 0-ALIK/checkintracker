// src/components/supervisor/EmployeeProgress.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { EmployeeProgress as EmployeeProgressType } from '@/services/supervisor-dashboard.service';
import { EmployeeJornada, ProgressFilters } from './types';

interface EmployeeProgressProps {
  employees: EmployeeProgressType[];
  filters: ProgressFilters;
  onPageChange: (page: number) => void;
  getStatusColor: (status: EmployeeJornada['status']) => string;
}

export function EmployeeProgress({
  employees,
  filters,
  onPageChange,
  getStatusColor
}: EmployeeProgressProps) {
  
  const paginatedData = useMemo(() => {
    const startIndex = (filters.currentPage - 1) * filters.itemsPerPage;
    const endIndex = startIndex + filters.itemsPerPage;
    
    return {
      data: employees.slice(startIndex, endIndex),
      total: employees.length,
      totalPages: Math.ceil(employees.length / filters.itemsPerPage)
    };
  }, [employees, filters.currentPage, filters.itemsPerPage]);

  if (employees.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Progreso Individual de Empleados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay datos de progreso disponibles</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Progreso Individual de Empleados
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Seguimiento detallado del rendimiento de cada empleado
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Información de paginación */}
          {employees.length > filters.itemsPerPage && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando {((filters.currentPage - 1) * filters.itemsPerPage) + 1} a {Math.min(filters.currentPage * filters.itemsPerPage, paginatedData.total)} de {paginatedData.total} empleados
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, filters.currentPage - 1))}
                  disabled={filters.currentPage === 1}
                >
                  Anterior
                </Button>
                
                <span className="text-sm text-muted-foreground px-2">
                  {filters.currentPage} / {paginatedData.totalPages}
                </span>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPageChange(Math.min(paginatedData.totalPages, filters.currentPage + 1))}
                  disabled={filters.currentPage === paginatedData.totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* Grid de empleados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedData.data.map((empleado) => (
              <div key={empleado.id_usuario} className="border rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 flex-shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {empleado.nombre.charAt(0)}{empleado.apellido.charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{empleado.nombre} {empleado.apellido}</p>
                      <p className="text-xs text-muted-foreground truncate">{empleado.area}</p>
                    </div>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={`${getStatusColor(empleado.estado_jornada)} text-white text-xs flex-shrink-0`}
                  >
                    {empleado.estado_jornada === 'Online' && 'Trabajando'}
                    {empleado.estado_jornada === 'Pending Approval' && 'Pendiente'}
                    {empleado.estado_jornada === 'Approved' && 'Completado'}
                    {empleado.estado_jornada === 'Offline' && 'Desconectado'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-4 gap-1 mb-3 text-center">
                  <div className="bg-gray-50 rounded p-1.5">
                    <div className="text-sm font-bold text-gray-800">{empleado.total_actividades}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="bg-green-50 rounded p-1.5">
                    <div className="text-sm font-bold text-green-600">{empleado.completadas}</div>
                    <div className="text-xs text-muted-foreground">OK</div>
                  </div>
                  <div className="bg-yellow-50 rounded p-1.5">
                    <div className="text-sm font-bold text-yellow-600">{empleado.en_progreso}</div>
                    <div className="text-xs text-muted-foreground">Prog</div>
                  </div>
                  <div className="bg-gray-50 rounded p-1.5">
                    <div className="text-sm font-bold text-gray-600">{empleado.pendientes}</div>
                    <div className="text-xs text-muted-foreground">Pend</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progreso:</span>
                    <span className="text-sm font-bold text-primary">{empleado.progreso_porcentaje}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${empleado.progreso_porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación inferior */}
          {employees.length > filters.itemsPerPage && (
            <div className="flex justify-center pt-2">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPageChange(Math.max(1, filters.currentPage - 1))}
                  disabled={filters.currentPage === 1}
                >
                  ←
                </Button>
                
                <span className="text-sm text-muted-foreground px-3">
                  {filters.currentPage} de {paginatedData.totalPages}
                </span>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onPageChange(Math.min(paginatedData.totalPages, filters.currentPage + 1))}
                  disabled={filters.currentPage === paginatedData.totalPages}
                >
                  →
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
