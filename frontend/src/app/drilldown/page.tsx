"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  Search, BrainCircuit, ArrowLeft, Download, 
  Activity, PieChart as PieIcon 
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

function DrillDownContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({ carreras: [], semestres: [] });
  const [selection, setSelection] = useState({
    carrera: searchParams.get("carrera") || "",
    semestre: searchParams.get("semestre") || "",
    search: searchParams.get("id") || ""
  });
  const [localFilter, setLocalFilter] = useState(searchParams.get("filter") || "TODOS");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await axios.get(`${API_URL}/drilldown/filters`);
        setFilters(res.data);
      } catch (e) { console.error(e); }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/drilldown/data?carrera=${selection.carrera}`);
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selection.carrera]);

  const filteredData = useMemo(() => {
    let base = data;
    if (selection.semestre) base = base.filter(d => d.semestre_num === parseInt(selection.semestre));
    if (selection.search) base = base.filter(d => d.id_estudiante.includes(selection.search.toUpperCase()));
    if (localFilter !== "TODOS") base = base.filter(d => d.prioridad === localFilter);
    return base;
  }, [data, selection.semestre, selection.search, localFilter]);

  const chartData = useMemo(() => {
    const counts = data.reduce((acc: any, curr: any) => {
      acc[curr.prioridad] = (acc[curr.prioridad] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: 'ALTO', value: counts['ALTO'] || 0 },
      { name: 'MEDIO', value: counts['MEDIO'] || 0 },
      { name: 'BAJO', value: counts['BAJO'] || 0 }
    ];
  }, [data]);

  const radarData = useMemo(() => {
    if (filteredData.length === 0) return [];
    
    // Normalizing values to show real SHAPE changes
    const avgAsis = filteredData.reduce((a, b) => a + (b.porcentaje_asistencia || 0), 0) / filteredData.length;
    const avgProm = (filteredData.reduce((a, b) => a + (b.promedio_anterior || 0), 0) / filteredData.length) * 10;
    const avgPlat = Math.min((filteredData.reduce((a, b) => a + (b.uso_plataforma_semana || 0), 0) / filteredData.length) * 15, 100);
    const avgTare = filteredData.reduce((a, b) => a + (b.entregas_tareas_pct || 0), 0) / filteredData.length;
    const avgRepr = (filteredData.reduce((a, b) => a + (b.materias_reprobadas_previas || 0), 0) / filteredData.length) * 25;

    return [
      { subject: 'Asistencia', A: avgAsis },
      { subject: 'Rendimiento', A: avgProm },
      { subject: 'Plataforma', A: avgPlat },
      { subject: 'Tareas', A: avgTare },
      { subject: 'Riesgo Mat.', A: Math.min(avgRepr, 100) },
    ];
  }, [filteredData]);

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400">
             <ArrowLeft className="h-5 w-5" />
          </button>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Buscar matrícula..." 
                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-white outline-none w-64"
                value={selection.search}
                onChange={(e) => setSelection({ ...selection, search: e.target.value })}
              />
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
         <div className="lg:col-span-3 flex flex-col gap-6 shrink-0 h-fit">
            <AnimatePresence>
              {!selection.carrera && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-[32px] bg-blue-600/5">
                   <p className="text-[10px] font-black text-blue-400 uppercase mb-4">Seleccionar Carrera</p>
                   <div className="grid grid-cols-1 gap-2">
                      {filters.carreras.map((c: string) => (
                        <button key={c} onClick={() => setSelection({ ...selection, carrera: c })}
                          className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-[10px] font-black uppercase"
                        >
                          {c}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
              {selection.carrera && (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-card p-6 rounded-[32px] bg-blue-600/10">
                   <div className="flex justify-between mb-4">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Carrera: {selection.carrera}</p>
                      <button onClick={() => setSelection({ carrera: "", semestre: "", search: "" })} className="text-[10px] font-black text-slate-500 underline">Cambiar</button>
                   </div>
                   <p className="text-[10px] font-black text-slate-500 uppercase mt-6 mb-4">Semestre</p>
                   <div className="grid grid-cols-4 gap-2">
                      {filters.semestres.map((s: number) => (
                        <button key={s} onClick={() => setSelection({ ...selection, semestre: selection.semestre === s.toString() ? "" : s.toString() })}
                          className={`py-3 rounded-xl font-black text-xs ${selection.semestre === s.toString() ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500"}`}
                        >
                          {s}°
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         <div className="lg:col-span-9 flex flex-col gap-6 min-h-0">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0 h-[350px]">
               <div className="glass-card p-6 rounded-[32px] bg-slate-900/20 relative overflow-hidden">
                  <div className="flex items-center gap-3 mb-4 text-slate-500">
                     <PieIcon className="h-4 w-4 text-blue-500" /> 
                     <span className="text-xs font-black uppercase">Resumen</span>
                  </div>
                  <div className="h-full">
                     <ResponsiveContainer width="100%" height="80%">
                        <PieChart>
                          <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                            {chartData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={entry.name === 'ALTO' ? '#ef4444' : entry.name === 'MEDIO' ? '#f59e0b' : '#10b981'} />
                            ))}
                          </Pie>
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
               </div>

               <div className="xl:col-span-2 glass-card p-6 rounded-[32px] bg-slate-900/20">
                  <div className="flex items-center gap-3 mb-4 text-slate-500">
                     <BrainCircuit className="h-4 w-4 text-indigo-500" /> 
                     <span className="text-xs font-black uppercase">Diagnóstico (Telaraña)</span>
                  </div>
                  <div className="h-full">
                    <ResponsiveContainer width="100%" height="90%">
                      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Radar
                          name="Riesgo"
                          dataKey="A"
                          stroke="#3b82f6"
                          fill="#3b82f6"
                          fillOpacity={0.5}
                        />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
               </div>
            </div>

            <div className="flex-1 min-h-0 flex flex-col gap-4">
               <div className="flex justify-between items-center px-4">
                  <h2 className="text-xl font-black text-white uppercase">Estudiantes ({filteredData.length})</h2>
                  <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                     {['TODOS', 'ALTO', 'MEDIO', 'BAJO'].map(f => (
                       <button key={f} onClick={() => setLocalFilter(f)}
                         className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${localFilter === f ? 'bg-white text-black' : 'text-slate-500'}`}
                       >
                         {f}
                       </button>
                     ))}
                  </div>
               </div>
               <div className="flex-1 overflow-auto custom-scrollbar glass-card rounded-[32px] bg-black/20">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#0f172a] text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                      <tr>
                        <th className="px-8 py-4">Matrícula</th>
                        <th className="px-8 py-4">Promedio</th>
                        <th className="px-8 py-4">Asistencia</th>
                        <th className="px-8 py-4 text-right">Riesgo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredData.map((st, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          <td className="px-8 py-4 font-black text-white">{st.id_estudiante}</td>
                          <td className="px-8 py-4 font-bold">{st.promedio_anterior?.toFixed(1)}</td>
                          <td className="px-8 py-4 font-bold">{st.porcentaje_asistencia?.toFixed(1)}%</td>
                          <td className="px-8 py-4 text-right">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${st.prioridad === 'ALTO' ? 'bg-red-500' : st.prioridad === 'MEDIO' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                               {st.prioridad}
                             </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

export default function DrillDown() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <DrillDownContent />
    </Suspense>
  );
}
