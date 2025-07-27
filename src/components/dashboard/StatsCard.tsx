'use client';

import { useState, useEffect } from 'react';
import { jornadasService } from '@/services/jornadas.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CheckCircle } from 'lucide-react';

interface StatsData {
  total_jornadas: number;
  horas_trabajadas: number;
  actividades_completadas: number;
}

interface StatsCardProps {
  userId: number;
  startDate: string;
  endDate: string;
}

export function StatsCard({ userId, startDate, endDate }: StatsCardProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const result = await jornadasService.getStats(userId, startDate, endDate);
        // La función devuelve un array, tomamos el primer elemento
        setStats(result[0] || { total_jornadas: 0, horas_trabajadas: 0, actividades_completadas: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, startDate, endDate]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-500 text-center">
            <p>Error: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas del Período</CardTitle>
        <CardDescription>
          Del {new Date(startDate).toLocaleDateString()} al {new Date(endDate).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Jornadas</p>
              <p className="text-2xl font-bold text-blue-600">{stats?.total_jornadas || 0}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <Clock className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Horas Trabajadas</p>
              <p className="text-2xl font-bold text-green-600">
                {stats?.horas_trabajadas ? Math.round(stats.horas_trabajadas * 10) / 10 : 0}h
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Actividades Completadas</p>
              <p className="text-2xl font-bold text-purple-600">{stats?.actividades_completadas || 0}</p>
            </div>
          </div>
        </div>
        
        {stats && stats.total_jornadas > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Promedio de horas por jornada:</span>
              <Badge variant="outline">
                {Math.round((stats.horas_trabajadas / stats.total_jornadas) * 10) / 10}h
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
