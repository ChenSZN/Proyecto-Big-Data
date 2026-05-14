"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Users, Briefcase, MapPin, GraduationCap, 
  Activity, Users2, Globe, Zap, Database
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
  CartesianGrid
} from "recharts";
import { motion } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const FALLBACK_ENV = {
  gender: { "Masculino": 3250, "Femenino": 1750 },
  work: { "No": 3800, "Si": 1200 },
  distance: [
    { name: "0-5km", value: 2100 },
    { name: "6-15km", value: 1850 },
    { name: "15km+", value: 1050 }
  ],
  age: [
    { name: "18-20", value: 2800 },
    { name: "21-23", value: 1450 },
    { name: "24+", value: 750 }
  ],
  support: { beca_pct: 35.4, internet_pct: 92.1, tutorias_pct: 28.5 }
};

export default function Environment() {
  const [data, setData] = useState<any>(FALLBACK_ENV);
  const [totalStudents, setTotalStudents] = useState(5000);

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const res = await axios.get(`${API_URL}/environment`);
        if (res.data && res.data.gender) {
          setData(res.data);
          const total = Object.values(res.data.gender as object).reduce((a, b) => a + (b as number), 0);
          setTotalStudents(total);
        }
      } catch (e) { console.warn("Fallback data active."); }
    };
    fetchEnv();
  }, []);

  const ageData = data?.age || FALLBACK_ENV.age;
  const distanceData = data?.distance || FALLBACK_ENV.distance;
  const genderData = Object.entries(data?.gender || FALLBACK_ENV.gender).map(([name, value]) => ({ name, value }));
  const workData = Object.entries(data?.work || FALLBACK_ENV.work).map(([name, value]) => ({ name, value }));
  const support = data?.support || FALLBACK_ENV.support;

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-4 bg-[#020617] overflow-y-auto lg:overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mt-12 md:mt-0">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Entorno Estudiantil</h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Análisis Socio-Demográfico y Apoyos</p>
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-5 py-2 rounded-[20px] flex items-center gap-3">
           <Database className="h-5 w-5 text-blue-500" />
           <div>
              <p className="text-[9px] font-black text-slate-500 uppercase leading-none">Población Total</p>
              <p className="text-xl font-black text-white italic">{totalStudents.toLocaleString()} Alumnos</p>
           </div>
        </div>
      </header>

      {/* Main Grid - Adjusted to fit screen without scroll on PC */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-0">
         {/* Distribución por Género */}
         <div className="glass-card p-6 rounded-[32px] bg-slate-900/40 border border-white/5 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2 text-blue-400">
               <Users className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Género</span>
            </div>
            <div className="flex-1 relative">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                     <Pie data={genderData} innerRadius="55%" outerRadius="80%" dataKey="value" stroke="none">
                        {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                     </Pie>
                     <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                  </PieChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Situación Laboral */}
         <div className="glass-card p-6 rounded-[32px] bg-slate-900/40 border border-white/5 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2 text-amber-500">
               <Briefcase className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Situación Laboral</span>
            </div>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workData}>
                     <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} />
                     <Tooltip cursor={{fill: 'transparent'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                     <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={35}>
                        {workData.map((entry, i) => <Cell key={i} fill={entry.name === 'No' ? '#10b981' : '#ef4444'} />)}
                     </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Rango de Edad */}
         <div className="glass-card p-6 rounded-[32px] bg-slate-900/40 border border-white/5 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-2 text-indigo-400">
               <Users2 className="h-4 w-4" />
               <span className="text-[10px] font-black uppercase tracking-widest">Rango de Edad</span>
            </div>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ageData} layout="vertical">
                     <XAxis type="number" hide />
                     <YAxis dataKey="name" type="category" tick={{fill: '#94a3b8', fontSize: 10}} axisLine={false} tickLine={false} width={50} />
                     <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                     <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Movilidad Estudiantil */}
         <div className="lg:col-span-2 glass-card p-8 rounded-[40px] bg-slate-900/40 border border-white/5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3 text-emerald-400">
                  <MapPin className="h-5 w-5" />
                  <span className="text-xs font-black uppercase tracking-widest">Movilidad: Distancia al Campus</span>
               </div>
            </div>
            <div className="flex-1">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distanceData}>
                     <XAxis dataKey="name" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                     <YAxis tick={{fill: '#475569', fontSize: 9}} axisLine={false} tickLine={false} />
                     <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} itemStyle={{color: '#fff', fontSize: '12px'}} />
                     <Bar dataKey="value" fill="#10b981" radius={[12, 12, 0, 0]} barSize={50} />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Factores de Permanencia */}
         <div className="glass-card p-8 rounded-[40px] bg-blue-600/10 border border-blue-500/20 flex flex-col min-h-0">
            <div className="flex items-center gap-3 mb-6 text-blue-400">
               <Zap className="h-5 w-5" />
               <span className="text-xs font-black uppercase tracking-widest">Factores de Permanencia</span>
            </div>
            <div className="flex-1 flex flex-col justify-between gap-4 overflow-hidden">
               {[
                 { label: "Acceso Tecnológico", val: support.internet_pct, color: "bg-blue-500" },
                 { label: "Cobertura de Becas", val: support.beca_pct, color: "bg-emerald-500" },
                 { label: "Participación Tutorías", val: support.tutorias_pct, color: "bg-amber-500" }
               ].map((item, i) => (
                 <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                       <p className="text-sm font-black text-white">{item.val}%</p>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                       <div className={`${item.color} h-full transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                    </div>
                 </div>
               ))}
               <p className="text-[9px] font-bold text-slate-500 uppercase mt-2 text-center italic">
                 Factores externos que impactan directamente en la retención estudiantil.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
