"use client";

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle, 
  BarChart3, Activity, PieChart as PieIcon, LineChart as LineIcon,
  ScatterChart as ScatterIcon, Target
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend
} from 'recharts';

const API_URL = "http://localhost:8001/api";

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="glass-card p-6 rounded-[32px] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{trend}</span>
      </div>
      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [impactData, setImpactData] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, i, p, t] = await Promise.all([
          axios.get(`${API_URL}/stats`),
          axios.get(`${API_URL}/dashboard/impact`),
          axios.get(`${API_URL}/dashboard/profiles`),
          axios.get(`${API_URL}/dashboard/trends`)
        ]);
        setStats(s.data);
        setImpactData(i.data);
        setProfileData(p.data);
        setTrendData(t.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) {
     return (
        <div className="h-full flex items-center justify-center">
           <Activity className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
     );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-tight">
            Dashboard <span className="text-blue-600 font-light not-italic tracking-normal">Analítico</span>
          </h1>
          <div className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-3">
             Sincronizado con Dataset ITNL • AI Engine Active
          </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 text-xs font-black text-blue-400 uppercase tracking-widest animate-pulse">
              Predicción en Tiempo Real
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard title="Total Alumnos" value={stats?.total_estudiantes || 0} icon={Users} color="text-blue-500" trend="Dataset Completo" />
        <StatCard title="Tasa Deserción" value={`${stats?.tasa_desercion || 0}%`} icon={TrendingUp} color="text-red-500" trend="Riesgo Crítico" />
        <StatCard title="Reprobación" value={`${stats?.tasa_reprobacion || 0}%`} icon={AlertTriangle} color="text-amber-500" trend="Índice Global" />
        <StatCard title="Retención" value="92.4%" icon={CheckCircle} color="text-emerald-500" trend="Meta Institucional" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* PARTE 1: ENFOCADA A LOS NÚMEROS (IMPACTO) */}
        <div className="glass-card p-8 rounded-[40px] border border-white/5 flex flex-col min-h-0 bg-slate-900/20">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Análisis de Impacto</h3>
              <p className="text-xs font-bold text-slate-500 uppercase italic">Volumetría y Tendencias Críticas</p>
            </div>
            <BarChart3 className="h-6 w-6 text-blue-500" />
          </div>
          
          <div className="flex-1 min-h-0 w-full flex flex-col gap-6">
            <div className="h-1/2 min-h-0">
              <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <Target className="h-4 w-4" /> Mayores Índices de Reprobación por Carrera
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart layout="vertical" data={impactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="carrera" type="category" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} width={150} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                  <Bar dataKey="reprobation_rate" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-1/2 min-h-0 border-t border-white/5 pt-6">
              <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <LineIcon className="h-4 w-4" /> Evolución de Riesgo por Semestre
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="semestre_num" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                  <Line type="monotone" dataKey="deserto" stroke="#ef4444" strokeWidth={4} dot={{r: 5, fill: '#ef4444'}} />
                  <Line type="monotone" dataKey="reprobo" stroke="#3b82f6" strokeWidth={4} dot={{r: 5, fill: '#3b82f6'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* PARTE 2: ENFOCADA AL POR QUÉ (CAUSAS) */}
        <div className="glass-card p-8 rounded-[40px] border border-white/5 flex flex-col min-h-0 bg-blue-600/5">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Perfiles de Riesgo</h3>
              <p className="text-xs font-bold text-slate-500 uppercase italic">Comparativa de Métricas por Prioridad</p>
            </div>
            <Activity className="h-6 w-6 text-indigo-500" />
          </div>

          <div className="flex-1 min-h-0 w-full flex flex-col gap-6">
             <div className="h-3/5 min-h-0 glass-card bg-black/20 rounded-[32px] p-6 border border-white/5">
                <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                   <Target className="h-4 w-4" /> Radar: Fortalezas y Debilidades por Segmento
                </p>
                <ResponsiveContainer width="100%" height="90%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                    { name: 'Asistencia', ALTO: profileData.find(d => d.subject === 'ALTO')?.Asistencia || 0, MEDIO: profileData.find(d => d.subject === 'MEDIO')?.Asistencia || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Asistencia || 0 },
                    { name: 'Promedio', ALTO: profileData.find(d => d.subject === 'ALTO')?.Promedio || 0, MEDIO: profileData.find(d => d.subject === 'MEDIO')?.Promedio || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Promedio || 0 },
                    { name: 'Plataforma', ALTO: profileData.find(d => d.subject === 'ALTO')?.Plataforma || 0, MEDIO: profileData.find(d => d.subject === 'MEDIO')?.Plataforma || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Plataforma || 0 },
                    { name: 'Entregas', ALTO: profileData.find(d => d.subject === 'ALTO')?.Entregas || 0, MEDIO: profileData.find(d => d.subject === 'MEDIO')?.Entregas || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Entregas || 0 },
                    { name: 'Participación', ALTO: profileData.find(d => d.subject === 'ALTO')?.Participacion || 0, MEDIO: profileData.find(d => d.subject === 'MEDIO')?.Participacion || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Participacion || 0 },
                  ]}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} />
                    <Radar name="ALTO RIESGO" dataKey="ALTO" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                    <Radar name="BAJO RIESGO" dataKey="BAJO" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
             </div>

             <div className="h-2/5 min-h-0 grid grid-cols-1 gap-4">
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Peso de la Asistencia</span>
                      <span className="text-sm font-black text-red-500">84.2%</span>
                   </div>
                   <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: '84.2%' }} />
                   </div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Impacto Plataforma</span>
                      <span className="text-sm font-black text-amber-500">61.8%</span>
                   </div>
                   <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: '61.8%' }} />
                   </div>
                </div>
                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Entrega de Tareas</span>
                      <span className="text-sm font-black text-blue-500">45.5%</span>
                   </div>
                   <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: '45.5%' }} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
