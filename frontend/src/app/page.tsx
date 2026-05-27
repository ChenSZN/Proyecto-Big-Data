"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
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
import ExplainerTrigger from "@/components/ExplainerTrigger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

// Helper function to fix encoding artifacts (mojibake) in frontend
const cleanText = (text: string) => {
  if (!text) return "";
  try { return decodeURIComponent(escape(text)); } catch (e) {
    return text
      .replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã\xad/g, 'í')
      .replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
  }
};

function StatCard({ title, value, icon: Icon, color, trend, onClick, explainerId }: any) {
  return (
    <div 
      onClick={onClick}
      className={`glass-card p-6 rounded-[32px] border border-white/5 bg-slate-900/40 hover:bg-slate-900/60 transition-all group relative ${onClick ? 'cursor-pointer hover:border-white/20 hover:scale-[1.02]' : ''}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-2xl bg-white/5 ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2">
          {explainerId && <ExplainerTrigger id={explainerId} />}
          <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{trend}</span>
        </div>
      </div>
      <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</h3>
      <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [stats, setStats] = useState<any>(null);
  const [impactData, setImpactData] = useState<any[]>([]);
  const [profileData, setProfileData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const carrera = searchParams.get("carrera") || "";
  const semestre = searchParams.get("semestre") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (carrera) params.set("carrera", carrera);
        if (semestre) params.set("semestre", semestre);
        const query = params.toString() ? `?${params.toString()}` : "";
        const [s, i, p, t] = await Promise.all([
          axios.get(`${API_URL}/stats${query}`),
          axios.get(`${API_URL}/dashboard/impact${query}`),
          axios.get(`${API_URL}/dashboard/profiles${query}`),
          axios.get(`${API_URL}/dashboard/trends${query}`)
        ]);
        setStats(s.data);
        const cleanedImpact = (i.data || []).map((item: any) => ({
           ...item,
           carrera: cleanText(item.carrera)
        }));
        setImpactData(cleanedImpact);
        setProfileData(p.data);
        setTrendData(t.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [carrera, semestre]);

  if (loading) {
     return (
        <div className="h-full flex items-center justify-center">
           <Activity className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
     );
  }

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 shrink-0">
        <StatCard 
          title="Total Alumnos" 
          value={stats?.total_estudiantes || 0} 
          icon={Users} 
          color="text-blue-500" 
          trend="" 
          onClick={() => router.push("/drilldown")}
          explainerId="total_estudiantes"
        />
        <StatCard 
          title="Tasa Deserción" 
          value={`${stats?.tasa_desercion || 0}%`} 
          icon={TrendingUp} 
          color="text-red-500" 
          trend="" 
          onClick={() => router.push("/drilldown?filter=ALTO")}
          explainerId="tasa_desercion"
        />
        <StatCard 
          title="Reprobación" 
          value={`${stats?.tasa_reprobacion || 0}%`} 
          icon={AlertTriangle} 
          color="text-amber-500" 
          trend="" 
          onClick={() => router.push("/drilldown?filter=ALTO")}
          explainerId="tasa_reprobacion"
        />
        <StatCard 
          title="Retención" 
          value={`${(100 - (stats?.tasa_desercion || 0)).toFixed(1)}%`} 
          icon={CheckCircle} 
          color="text-emerald-500" 
          trend="" 
          explainerId="tasa_retencion"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 flex-1 min-h-0 pb-4 md:pb-0">
        <div className="glass-card p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-white/5 flex flex-col min-h-[400px] md:min-h-0 bg-slate-900/20">
          <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                Análisis de Impacto
                <ExplainerTrigger id="impacto_carrera" />
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase italic">Volumetría y Tendencias Críticas</p>
            </div>
            <BarChart3 className="h-5 w-5 md:h-6 md:w-6 text-blue-500" />
          </div>
          
          <div className="flex-1 min-h-0 w-full flex flex-col gap-6">
            <div className="flex-1 min-h-0">
              <p className="text-[9px] md:text-xs font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <Target className="h-4 w-4" /> Mayores Índices de Reprobación por Carrera
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart layout="vertical" data={impactData} margin={{ left: -10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="carrera" type="category" width={110} tick={{fill: '#94a3b8', fontSize: 8, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                  <Bar dataKey="reprobation_rate" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="h-[140px] md:h-1/2 min-h-0">
              <p className="text-[9px] md:text-xs font-black text-slate-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                 <LineIcon className="h-4 w-4" /> Evolución de Riesgo por Semestre
                 <ExplainerTrigger id="evolucion_semestre" />
              </p>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={trendData} onClick={(data: any) => data && data.activePayload && router.push(`/drilldown?semestre=${data.activePayload[0].payload.semestre_num}`)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="semestre_num" stroke="#94a3b8" fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 900}} />
                  <YAxis stroke="#94a3b8" fontSize={9} axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 900}} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '10px' }} />
                  <Line name="REPROBACIÓN" type="monotone" dataKey="reprobo" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line name="DESERCIÓN" type="monotone" dataKey="deserto" stroke="#ef4444" strokeWidth={3} dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 md:p-8 rounded-[32px] md:rounded-[40px] border border-white/5 flex flex-col min-h-[400px] md:min-h-0 bg-blue-600/5">
          <div className="flex items-center justify-between mb-4 md:mb-6 shrink-0">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                Perfiles de Riesgo
                <ExplainerTrigger id="rendimiento_segmento" />
              </h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase italic">Comparativa de Métricas por Prioridad</p>
            </div>
            <Activity className="h-5 w-5 md:h-6 md:w-6 text-indigo-500" />
          </div>

          <div className="flex-1 min-h-0 w-full flex flex-col gap-4">
             <div className="flex-1 min-h-[200px] glass-card bg-black/20 rounded-[32px] p-4 border border-white/5 relative">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                   <BarChart3 className="h-3 w-3" /> Comparativa de Rendimiento por Segmento
                </p>
                <div className="absolute inset-0 pt-10 px-4 pb-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Asis', ALTO: profileData.find(d => d.subject === 'ALTO')?.Asistencia || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Asistencia || 0 },
                      { name: 'Prom', ALTO: profileData.find(d => d.subject === 'ALTO')?.Promedio || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Promedio || 0 },
                      { name: 'Plat', ALTO: profileData.find(d => d.subject === 'ALTO')?.Plataforma || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Plataforma || 0 },
                      { name: 'Tar', ALTO: profileData.find(d => d.subject === 'ALTO')?.Entregas || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Entregas || 0 },
                      { name: 'Part', ALTO: profileData.find(d => d.subject === 'ALTO')?.Participacion || 0, BAJO: profileData.find(d => d.subject === 'BAJO')?.Participacion || 0 },
                    ]} margin={{ top: 10, right: 5, left: -30, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 7, fontWeight: 900}} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '8px', fontWeight: 900, paddingTop: '5px' }} />
                      <Bar name="ALTO" dataKey="ALTO" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={8} />
                      <Bar name="BAJO" dataKey="BAJO" fill="#10b981" radius={[3, 3, 0, 0]} barSize={8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
             </div>

             <div className="h-[55%] min-h-0 grid grid-cols-1 gap-3 overflow-hidden">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Asistencia</span>
                         <ExplainerTrigger id="peso_asistencia" />
                      </div>
                      <span className="text-xs font-black text-red-500">84.2%</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full" style={{ width: '84.2%' }} />
                   </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Impacto Plataforma</span>
                         <ExplainerTrigger id="impacto_plataforma" />
                      </div>
                      <span className="text-xs font-black text-amber-500">61.8%</span>
                   </div>
                   <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full" style={{ width: '61.8%' }} />
                   </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                   <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrega Tareas</span>
                         <ExplainerTrigger id="entrega_tareas_prog" />
                      </div>
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

export default function Dashboard() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Activity className="h-10 w-10 text-blue-500 animate-spin" /></div>}>
       <DashboardContent />
    </Suspense>
  );
}
