// src/components/supervisor/SupervisorCharts.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Activity,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { EmployeeJornada } from './types';

interface SupervisorChartsProps {
  jornadas: EmployeeJornada[];
  todayJornadas: EmployeeJornada[];
  formatDuration: (startTime: string, endTime?: string) => string;
  getUniqueAreas: () => string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function SupervisorCharts({
  jornadas,
  todayJornadas,
  formatDuration,
  getUniqueAreas
}: SupervisorChartsProps) {

  // Datos para gráficos
  const chartData = useMemo(() => {
    // Distribución por estado
    const statusDistribution = jornadas.reduce((acc, jornada) => {
      const status = jornada.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusChartData = Object.entries(statusDistribution).map(([status, count]) => ({
      name: status === 'Online' ? 'Trabajando' : 
            status === 'Pending Approval' ? 'Pendiente' :
            status === 'Approved' ? 'Aprobado' : 'Sin Actividad',
      value: count,
      color: status === 'Online' ? '#00C49F' : 
             status === 'Pending Approval' ? '#FFBB28' :
             status === 'Approved' ? '#0088FE' : '#FF8042'
    }));

    // Distribución por área
    const areaDistribution = jornadas.reduce((acc, jornada) => {
      const area = jornada.usuario?.area?.nombre_area || 'Sin área';
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const areaChartData = Object.entries(areaDistribution).map(([area, count]) => ({
      area: area,
      jornadas: count
    }));

    // Actividad por días de la semana (últimos 30 días)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentJornadas = jornadas.filter(j => {
      const jornadaDate = new Date(j.fecha.split('T')[0]);
      return jornadaDate >= thirtyDaysAgo;
    });

    const weeklyActivity = recentJornadas.reduce((acc, jornada) => {
      const date = new Date(jornada.fecha.split('T')[0]);
      const dayName = date.toLocaleDateString('es-ES', { weekday: 'short' }).toLowerCase();
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const weeklyChartData = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'].map(day => {
      const dayKey = day.toLowerCase().substring(0, 3);
      return {
        day: day.charAt(0).toUpperCase() + day.slice(1),
        jornadas: weeklyActivity[dayKey] || 0
      };
    });

    // Tendencia de los últimos 7 días con datos reales
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const trendData = last7Days.map(date => {
      const dayJornadas = jornadas.filter(j => j.fecha.split('T')[0] === date);
      const approvedCount = dayJornadas.filter(j => j.status === 'Approved').length;
      const workingCount = dayJornadas.filter(j => j.status === 'Online').length;
      const totalCount = dayJornadas.length;
      
      return {
        date: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
        total: totalCount,
        aprobadas: approvedCount,
        trabajando: workingCount,
        pendientes: totalCount - approvedCount - workingCount
      };
    });

    // Productividad por área (nuevas métricas útiles)
    const areaProductivity = Object.entries(areaDistribution).map(([area, count]) => {
      const areaJornadas = jornadas.filter(j => j.usuario?.area?.nombre_area === area);
      const completedCount = areaJornadas.filter(j => j.status === 'Approved').length;
      const productivity = count > 0 ? Math.round((completedCount / count) * 100) : 0;
      
      return {
        area: area.length > 15 ? area.substring(0, 15) + '...' : area,
        productividad: productivity,
        total: count,
        completadas: completedCount
      };
    }).sort((a, b) => b.productividad - a.productividad);

    // Horarios de trabajo (distribución de check-ins por hora)
    const workingHours = todayJornadas.reduce((acc, jornada) => {
      if (jornada.hora_checkin) {
        const hour = new Date(jornada.hora_checkin).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const hourlyChartData = Array.from({ length: 24 }, (_, hour) => ({
      hora: `${hour.toString().padStart(2, '0')}:00`,
      checkins: workingHours[hour] || 0
    })).filter((item, index) => item.checkins > 0 || (index >= 6 && index <= 22)); // Solo mostrar horas relevantes

    return {
      statusChartData,
      areaChartData,
      weeklyChartData,
      trendData,
      areaProductivity,
      hourlyChartData
    };
  }, [jornadas]);

  // Estadísticas de hoy
  const todayStats = useMemo(() => {
    const working = todayJornadas.filter(j => j.status === 'Online').length;
    const pending = todayJornadas.filter(j => j.status === 'Pending Approval').length;
    const approved = todayJornadas.filter(j => j.status === 'Approved').length;
    const total = todayJornadas.length;

    const averageHours = todayJornadas.reduce((acc, jornada) => {
      if (jornada.hora_checkout) {
        const start = new Date(`2000-01-01T${jornada.hora_checkin}`);
        const end = new Date(`2000-01-01T${jornada.hora_checkout}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return acc + hours;
      }
      return acc;
    }, 0) / (todayJornadas.filter(j => j.hora_checkout).length || 1);

    return { working, pending, approved, total, averageHours };
  }, [todayJornadas]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5" />
              <span>Estados de Jornadas</span>
            </CardTitle>
            <CardDescription>
              Distribución actual de {jornadas.length} jornadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Productividad por área */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Productividad por Área</span>
            </CardTitle>
            <CardDescription>
              % de jornadas completadas por área
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.areaProductivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="area" 
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={12} domain={[0, 100]} />
                  <Tooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-3">
                            <p className="font-medium">{label}</p>
                            <p className="text-blue-600">Productividad: {data.productividad}%</p>
                            <p className="text-sm text-gray-600">Completadas: {data.completadas}/{data.total}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="productividad" fill="#0088FE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Horarios de trabajo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Horarios de Check-in Hoy</span>
            </CardTitle>
            <CardDescription>
              Distribución de check-ins por hora del día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.hourlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hora" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="checkins" fill="#8884D8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tendencia últimos 7 días */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LineChartIcon className="h-5 w-5" />
              <span>Tendencia (7 días)</span>
            </CardTitle>
            <CardDescription>
              Evolución diaria de jornadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#0088FE" 
                    strokeWidth={2}
                    name="Total"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="aprobadas" 
                    stroke="#00C49F" 
                    strokeWidth={2}
                    name="Aprobadas"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="trabajando" 
                    stroke="#FF8C00" 
                    strokeWidth={2}
                    name="Trabajando"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pendientes" 
                    stroke="#FFBB28" 
                    strokeWidth={2}
                    name="Pendientes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica expandida de actividad semanal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Actividad Semanal</span>
          </CardTitle>
          <CardDescription>
            Promedio de jornadas por día de la semana (últimos 30 días)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData.weeklyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" fontSize={14} />
                <YAxis fontSize={14} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="jornadas" 
                  stroke="#00C49F" 
                  fill="#00C49F" 
                  fillOpacity={0.3}
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
