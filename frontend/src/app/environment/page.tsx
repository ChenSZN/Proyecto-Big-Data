"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { 
  Users, Briefcase, MapPin, 
  Activity, Users2, Zap, Database
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import ExplainerTrigger from "@/components/ExplainerTrigger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const renderGenderLabel = ({ cx, cy, midAngle, outerRadius, percent, name, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 15;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const labelName = name === 'F' || name === 'Femenino' || name.toLowerCase().includes('fem') ? 'Femenino' : 'Masculino';
  return (
    <text x={x} y={y} fill="#cbd5e1" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-[11px] font-black uppercase tracking-wider">
      {`${labelName}: ${(percent * 100).toFixed(1)}% (${value})`}
    </text>
  );
};

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

function EnvironmentContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(FALLBACK_ENV);
  const [totalStudents, setTotalStudents] = useState(5000);
  const [loading, setLoading] = useState(false);

  const carrera = searchParams.get("carrera") || "";
  const semestre = searchParams.get("semestre") || "";

  useEffect(() => {
    const fetchEnv = async () => {
      setLoading(true);
      try {
        // Only send filter params if they are actually set
        const params = new URLSearchParams();
        if (carrera) params.set("carrera", carrera);
        if (semestre) params.set("semestre", semestre);
        const query = params.toString() ? `?${params.toString()}` : "";
        const res = await axios.get(`${API_URL}/environment${query}`);
        if (res.data && res.data.gender) {
          setData(res.data);
          const total = Object.values(res.data.gender as object).reduce((a, b) => a + (b as number), 0);
          setTotalStudents(total);
        }
      } catch (e) { console.warn("Fallback active."); }
      finally { setLoading(false); }
    };
    fetchEnv();
  }, [carrera, semestre]);

  const carreraLabel = carrera ? carrera.replace(/Ingenier.a/g, 'Ing.') : "Todas las Carreras";
  const semestreLabel = semestre ? `Semestre ${semestre}` : "Todos los Semestres";

  const ageData = data?.age || FALLBACK_ENV.age;
  const distanceData = data?.distance || FALLBACK_ENV.distance;
  const genderData = Object.entries(data?.gender || FALLBACK_ENV.gender).map(([name, value]) => ({ name, value }));
  const workData = Object.entries(data?.work || FALLBACK_ENV.work).map(([name, value]) => ({ name, value }));
  const support = data?.support || FALLBACK_ENV.support;

  return (
    <div className="p-4 md:p-6 flex flex-col gap-4 bg-[#020617]">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 mt-12 md:mt-0">
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Entorno Estudiantil</h1>
          <p className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] italic">Análisis Socio-Demográfico y Apoyos</p>
          {/* Active filter badge */}
          {(carrera || semestre) && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {carrera && <span className="text-xs font-black px-2 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 uppercase">{carreraLabel}</span>}
              {semestre && <span className="text-xs font-black px-2 py-1 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 uppercase">{semestreLabel}</span>}
            </div>
          )}
        </div>
        <div className="bg-blue-600/10 border border-blue-500/20 px-5 py-2 rounded-[20px] flex items-center gap-3 shadow-lg shadow-blue-500/5">
           <Database className="h-5 w-5 text-blue-500" />
            <div>
               <p className="text-xs font-black text-slate-300 uppercase leading-none">Población del Segmento</p>
               <p className="text-2xl font-black text-white italic">{totalStudents.toLocaleString()} Alumnos</p>
            </div>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-0 pb-6 md:pb-0">
         <div className="glass-card p-5 md:p-6 rounded-[32px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2 text-blue-400">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Género</span>
               </div>
               <ExplainerTrigger id="distribucion_genero" />
            </div>
             <div className="h-[240px] relative">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart margin={{ top: 20, bottom: 20, left: 30, right: 30 }}>
                      <Pie 
                        data={genderData} 
                        innerRadius="40%" 
                        outerRadius="65%" 
                        dataKey="value" 
                        stroke="none"
                        label={renderGenderLabel}
                      >
                         {genderData.map((entry, i) => (
                           <Cell key={i} fill={entry.name === 'F' || entry.name === 'Femenino' || entry.name.toLowerCase().includes('fem') ? "#ec4899" : "#3b82f6"} />
                         ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} 
                        itemStyle={{color: '#fff'}}
                        formatter={(value: any, name: any) => {
                          const total = totalStudents;
                          const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                          const labelName = name === 'F' || name === 'Femenino' || name.toLowerCase().includes('fem') ? 'Femenino' : 'Masculino';
                          return [`${value} alumnos (${pct}%)`, labelName];
                        }}
                      />
                   </PieChart>
                </ResponsiveContainer>
             </div>
         </div>

         <div className="glass-card p-5 md:p-6 rounded-[32px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2 text-amber-500">
                  <Briefcase className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Situación Laboral</span>
               </div>
               <ExplainerTrigger id="situacion_laboral" />
            </div>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={workData} margin={{ left: 10, right: 10, top: 20, bottom: 10 }}>
                      <XAxis dataKey="name" tick={{fill: '#cbd5e1', fontSize: 12}} axisLine={false} tickLine={false} />
                      <Tooltip 
                         cursor={{fill: 'transparent'}} 
                         contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} 
                         itemStyle={{color: '#fff'}}
                         formatter={(value: any) => {
                           const total = totalStudents;
                           const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                           return [`${value} alumnos (${pct}%)`, "Trabaja"];
                         }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={30}>
                         {workData.map((entry, i) => <Cell key={i} fill={entry.name === 'No' ? '#10b981' : '#ef4444'} />)}
                      </Bar>
                   </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className="glass-card p-5 md:p-6 rounded-[32px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between mb-2">
               <div className="flex items-center gap-2 text-indigo-400">
                  <Users2 className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Rango de Edad</span>
               </div>
               <ExplainerTrigger id="rango_edad" />
            </div>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={ageData} layout="vertical" margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" tick={{fill: '#cbd5e1', fontSize: 12}} axisLine={false} tickLine={false} width={45} />
                      <Tooltip 
                         contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} 
                         itemStyle={{color: '#fff'}}
                         formatter={(value: any) => {
                           const total = totalStudents;
                           const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                           return [`${value} alumnos (${pct}%)`, "Estudiantes"];
                         }}
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={18} />
                   </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-slate-900/40 border border-white/5 flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3 text-emerald-400">
                  <MapPin className="h-4 w-4 md:h-5 md:w-5" />
                  <span className="text-xs md:text-sm font-black uppercase tracking-widest">Movilidad: Distancia al Campus</span>
               </div>
               <ExplainerTrigger id="distancia_campus" />
            </div>
            <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={distanceData} margin={{ left: 10, right: 10, top: 20, bottom: 10 }}>
                      <XAxis dataKey="name" tick={{fill: '#cbd5e1', fontSize: 12, fontWeight: 'bold'}} axisLine={false} tickLine={false} />
                      <YAxis tick={{fill: '#94a3b8', fontSize: 11}} width={40} axisLine={false} tickLine={false} />
                      <Tooltip 
                         contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px'}} 
                         itemStyle={{color: '#fff'}}
                         formatter={(value: any) => {
                           const total = totalStudents;
                           const pct = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                           return [`${value} alumnos (${pct}%)`, "Estudiantes"];
                         }}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[12, 12, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
            </div>
         </div>

         <div className="glass-card p-8 rounded-[40px] bg-blue-600/10 border border-blue-500/20 flex flex-col min-h-[340px]">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3 text-blue-400">
                  <Zap className="h-5 w-5" />
                  <span className="text-sm font-black uppercase tracking-widest">Factores de Permanencia</span>
               </div>
               <ExplainerTrigger id="factores_permanencia" />
            </div>
            <div className="flex-1 flex flex-col justify-between gap-4 overflow-hidden">
               {[
                 { label: "Acceso Tecnológico", val: support.internet_pct, color: "bg-blue-500" },
                 { label: "Cobertura de Becas", val: support.beca_pct, color: "bg-emerald-500" },
                 { label: "Participación Tutorías", val: support.tutorias_pct, color: "bg-amber-500" }
               ].map((item, i) => (
                 <div key={i} className="p-4 rounded-2xl bg-black/20 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                       <p className="text-xs font-black text-slate-300 uppercase tracking-widest">{item.label}</p>
                       <p className="text-base font-black text-white">{item.val}%</p>
                    </div>
                    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                       <div className={`${item.color} h-full transition-all duration-1000`} style={{ width: `${item.val}%` }} />
                    </div>
                 </div>
               ))}
               <p className="text-xs font-bold text-slate-300 uppercase mt-2 text-center italic">
                 Factores externos que impactan directamente en la retención estudiantil.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function Environment() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Activity className="h-10 w-10 text-blue-500 animate-spin" /></div>}>
       <EnvironmentContent />
    </Suspense>
  );
}
