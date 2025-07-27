'use client';

import { useState } from 'react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function EstadisticasPage() {
  const [userId, setUserId] = useState<number>(1); // Por defecto, usuario 1
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  ); // Primer día del mes actual
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  ); // Hoy
  const [showStats, setShowStats] = useState<boolean>(true);

  const handleRefresh = () => {
    setShowStats(false);
    setTimeout(() => setShowStats(true), 100); // Forzar re-render
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Estadísticas de Jornadas</h1>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Consulta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">ID Usuario</Label>
              <Input
                id="userId"
                type="number"
                value={userId}
                onChange={(e) => setUserId(Number(e.target.value))}
                placeholder="ID del usuario"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleRefresh} className="w-full">
                Actualizar Estadísticas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      {showStats && (
        <StatsCard
          userId={userId}
          startDate={startDate}
          endDate={endDate}
        />
      )}

      {/* Información Adicional 
      <Card>
        <CardHeader>
          <CardTitle>Información</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Funcionalidad:</strong> Esta página utiliza la función SQL{' '}
              <code className="bg-gray-100 px-1 rounded">obtener_estadisticas_empleado()</code>{' '}
              implementada directamente en PostgreSQL.
            </p>
            <p>
              <strong>Datos mostrados:</strong> Total de jornadas, horas trabajadas y actividades completadas
              para el usuario y rango de fechas seleccionado.
            </p>
            <p>
              <strong>Tecnologías:</strong> PostgreSQL (función), NestJS (API), Next.js (Frontend)
            </p>
          </div>
        </CardContent>
      </Card>
        */}
    </div>
    
  );
}
