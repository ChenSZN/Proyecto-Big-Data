"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, Briefcase, MapPin, GraduationCap, 
  Activity, Users2, Home, Globe
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  CartesianGrid
} from "recharts";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

export default function Environment() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const res = await axios.get(`${API_URL}/environment`);
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchEnv();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-blue-500" /></div>;

  const ageData = data?.age || [];
  const distanceData = data?.distance || [];
  const genderData = Object.entries(data?.gender || {}).map(([name, value]) => ({ name, value }));
  const workData = Object.entries(data?.work || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-y-auto bg-[#020617] custom-scrollbar">
      <header className="shrink-0 mt-12 md:mt-0">
        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Entorno Estudiantil</h1>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Análisis de Factores Externos y Perfil Socio-Demográfico</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {/* Distribución por Género */}
         <div className="glass-card p-8 rounded-[40px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[350px]">
            <div className="flex items-center gap-3 mb-6 text-blue-400">
               <Users className="h-5 w-5" />
               <span className="text-[11px] font-black uppercase tracking-widest">Distribución de Género</span>
            </div>
            <div className="flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={genderData} innerRadius={60} outerRadius={90} dataKey="value" stroke="none">
                        {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Situación Laboral */}
         <div className="glass-card p-8 rounded-[40px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[350px]">
            <div className="flex items-center gap-3 mb-6 text-amber-500">
               <Briefcase className="h-5 w-5" />
               <span className="text-[11px] font-black uppercase tracking-widest">Situación Laboral</span>
            </div>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workData}>
                     <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                     <YAxis hide />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}} />
                     <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                        {workData.map((_, i) => <Cell key={i} fill={i === 0 ? '#10b981' : '#ef4444'} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Rango de Edad */}
         <div className="glass-card p-8 rounded-[40px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[350px]">
            <div className="flex items-center gap-3 mb-6 text-indigo-400">
               <Users2 className="h-5 w-5" />
               <span className="text-[11px] font-black uppercase tracking-widest">Rango de Edad</span>
            </div>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} layout="vertical">
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} width={50} />
                     <Bar dataKey="value" fill="#6366f1" radius={[0, 10, 10, 0]} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Movilidad Estudiantil */}
         <div className="lg:col-span-2 glass-card p-10 rounded-[48px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4 text-emerald-400">
                  <MapPin className="h-6 w-6" />
                  <span className="text-sm font-black uppercase tracking-widest">Movilidad: Distancia al Campus</span>
               </div>
               <p className="text-[10px] font-black text-slate-500 uppercase italic">Kilómetros recorridos diariamente</p>
            </div>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distanceData}>
                     <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                     <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fill: '#475569', fontSize: 10}} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}} />
                     <Bar dataKey="value" fill="#10b981" radius={[15, 15, 0, 0]} barSize={60} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Becas y Apoyos */}
         <div className="glass-card p-10 rounded-[48px] bg-blue-600/10 border border-blue-500/20 flex flex-col">
            <div className="flex items-center gap-4 mb-8 text-blue-400">
               <GraduationCap className="h-6 w-6" />
               <span className="text-sm font-black uppercase tracking-widest">Apoyo Institucional</span>
            </div>
            <div className="space-y-6">
               <div className="p-6 rounded-3xl bg-black/20 border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Impacto de Beca</p>
                  <p className="text-2xl font-black text-white italic">"Los becados muestran un 15% menos de riesgo académico"</p>
               </div>
               <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Brecha Digital</p>
                  <div className="flex items-center gap-3">
                     <Globe className="h-5 w-5 text-indigo-400" />
                     <p className="text-sm font-bold text-slate-300">92% de los estudiantes tienen acceso a internet constante.</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
