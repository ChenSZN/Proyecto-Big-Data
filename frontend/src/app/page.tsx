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

import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

function StatCard({ title, value, icon: Icon, color, trend, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`glass-card p-6 rounded-[32px] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group ${onClick ? 'cursor-pointer hover:border-white/20 hover:scale-[1.02]' : ''}`}
    >
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

  const router = useRouter();

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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mb-2">
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <StatCard 
          title="Total Alumnos" 
          value={stats?.total_estudiantes || 0} 
          icon={Users} 
          color="text-blue-500" 
          trend="Dataset Completo" 
          onClick={() => router.push("/drilldown")}
        />
        <StatCard 
          title="Tasa Deserción" 
          value={`${stats?.tasa_desercion || 0}%`} 
          icon={TrendingUp} 
          color="text-red-500" 
          trend="Riesgo Crítico" 
          onClick={() => router.push("/drilldown?filter=ALTO")}
        />
        <StatCard 
          title="Reprobación" 
          value={`${stats?.tasa_reprobacion || 0}%`} 
          icon={AlertTriangle} 
          color="text-amber-500" 
          trend="Índice Global" 
          onClick={() => router.push("/drilldown?filter=ALTO")}
        />
        <StatCard 
          title="Retención" 
          value="92.4%" 
          icon={CheckCircle} 
          color="text-emerald-500" 
          trend="Meta Institucional" 
        />
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
            <div className="flex-1 min-h-0">
              <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <Target className="h-4 w-4" /> Mayores Índices de Reprobación por Carrera
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart layout="vertical" data={impactData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="carrera" type="category" width={140} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                  <Bar dataKey="reprobation_rate" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-1/2 min-h-0">
              <p className="text-xs font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <LineIcon className="h-4 w-4" /> Evolución de Riesgo por Semestre
              </p>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={trendData} onClick={(data: any) => data && data.activePayload && router.push(`/drilldown?semestre=${data.activePayload[0].payload.semestre_num}`)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="semestre_num" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 900}} />
                  <YAxis stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 900}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }} />
                  <Line type="monotone" dataKey="reprobo" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                  <Line type="monotone" dataKey="deserto" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 8, strokeWidth: 0 }} />
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

          <div className="flex-1 min-h-0 w-full flex flex-col gap-4">
             <div className="h-[45%] min-h-0 glass-card bg-black/20 rounded-[32px] p-4 border border-white/5 relative">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                   <BarChart3 className="h-3 w-3" /> Comparativa de Rendimiento por Segmento
                </p>
                <div className="absolute inset-0 pt-10 px-4 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Asistencia', ALTO: profileData.find(d => d.subject === 'ALTO')?.Asistencia || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Asistencia || 0 },
                      { name: 'Promedio', ALTO: profileData.find(d => d.subject === 'ALTO')?.Promedio || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Promedio || 0 },
                      { name: 'Plataforma', ALTO: profileData.find(d => d.subject === 'ALTO')?.Plataforma || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Plataforma || 0 },
                      { name: 'Tareas', ALTO: profileData.find(d => d.subject === 'ALTO')?.Entregas || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Entregas || 0 },
                      { name: 'Participación', ALTO: profileData.find(d => d.subject === 'ALTO')?.Participacion || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Participacion || 0 },
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 900}} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 900, paddingTop: '10px' }} />
                      <Bar name="ALTO RIESGO" dataKey="ALTO" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                      <Bar name="BAJO RIESGO" dataKey="BAJO" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="h-[55%] min-h-0 grid grid-cols-1 gap-3 overflow-hidden">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Asistencia</span>
                      <span className="text-xs font-black text-red-500">84.2%</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: '84.2%' }} />
                   </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacto Plataforma</span>
                      <span className="text-xs font-black text-amber-500">61.8%</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: '61.8%' }} />
                   </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega Tareas</span>
                      <span className="text-xs font-black text-blue-500">45.5%</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
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
