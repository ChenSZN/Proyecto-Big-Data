"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ArrowLeft, Activity, PieChart as PieIcon 
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip
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
        const params = new URLSearchParams();
        if (selection.carrera) params.append("carrera", selection.carrera);
        if (selection.semestre) params.append("semestre", selection.semestre);
        if (selection.search) params.append("search", selection.search);
        
        const res = await axios.get(`${API_URL}/drilldown/data?${params.toString()}`);
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selection.carrera, selection.semestre, selection.search]);

  const filteredData = useMemo(() => {
    if (localFilter === "TODOS") return data;
    return data.filter(d => d.prioridad === localFilter);
  }, [data, localFilter]);

  const chartData = useMemo(() => {
    const counts = data.reduce((acc: any, curr: any) => {
      const p = curr.prioridad || "BAJO";
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {});
    return [
      { name: 'ALTO', value: counts['ALTO'] || 0 },
      { name: 'MEDIO', value: counts['MEDIO'] || 0 },
      { name: 'BAJO', value: counts['BAJO'] || 0 }
    ];
  }, [data]);

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex items-center gap-4 shrink-0">
        <button onClick={() => router.push("/")} className="p-4 rounded-[20px] bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
           <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Explorador de Datos</h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Sincronización en Tiempo Real por Carrera y Semestre</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
         {/* Filtros Lateral */}
         <div className="lg:col-span-3 flex flex-col gap-6 shrink-0 h-fit">
            <AnimatePresence>
              {!selection.carrera && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 rounded-[40px] bg-blue-600/5 border border-white/5">
                   <p className="text-[10px] font-black text-blue-400 uppercase mb-6 tracking-widest">Seleccionar Carrera</p>
                   <div className="grid grid-cols-1 gap-2">
                      {filters.carreras.map((c: string) => (
                        <button key={c} onClick={() => setSelection({ ...selection, carrera: c })}
                          className="px-5 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-left text-[11px] font-black uppercase tracking-tight transition-all"
                        >
                          {c}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
              {selection.carrera && (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-card p-8 rounded-[40px] bg-blue-600/10 border border-blue-500/20">
                   <div className="flex justify-between items-center mb-6">
                      <div className="max-w-[140px]">
                        <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Filtro Activo</p>
                        <p className="text-sm font-black text-white uppercase truncate">{selection.carrera}</p>
                      </div>
                      <button onClick={() => setSelection({ carrera: "", semestre: "", search: "" })} className="text-[10px] font-black text-blue-400 hover:text-white underline">CAMBIAR</button>
                   </div>
                   <p className="text-[10px] font-black text-slate-500 uppercase mb-4 tracking-widest">Semestre</p>
                   <div className="grid grid-cols-4 gap-2">
                      {filters.semestres.map((s: number) => (
                        <button key={s} onClick={() => setSelection({ ...selection, semestre: selection.semestre === s.toString() ? "" : s.toString() })}
                          className={`py-4 rounded-2xl font-black text-sm transition-all ${selection.semestre === s.toString() ? "bg-blue-600 text-white shadow-xl shadow-blue-500/20" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                        >
                          {s}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         <div className="lg:col-span-9 flex flex-col gap-6 min-h-0">
            {/* Gráfica de Resumen Ampliada */}
            <div className="glass-card p-10 rounded-[48px] bg-slate-900/20 border border-white/5 relative flex flex-col h-[350px] lg:h-[400px] shrink-0 overflow-hidden">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 text-slate-400">
                     <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                        <PieIcon className="h-6 w-6" />
                     </div>
                     <div>
                        <span className="text-sm font-black uppercase tracking-tighter text-white">Distribución de Riesgo</span>
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Estado Actual del Segmento</p>
                     </div>
                  </div>
                  <div className="hidden md:flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                     {['TODOS', 'ALTO', 'MEDIO', 'BAJO'].map(f => (
                       <button key={f} onClick={() => setLocalFilter(f)}
                         className={`px-5 py-2.5 rounded-[14px] text-[10px] font-black transition-all ${localFilter === f ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                       >
                         {f}
                       </button>
                     ))}
                  </div>
               </div>
               
               <div className="flex-1 relative min-h-0 flex items-center justify-center">
                  <div className="w-full h-full max-w-md">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={chartData} innerRadius={80} outerRadius={120} paddingAngle={10} dataKey="value" stroke="none">
                            {chartData.map((entry) => (
                              <Cell key={`cell-${entry.name}`} fill={entry.name === 'ALTO' ? '#ef4444' : entry.name === 'MEDIO' ? '#f59e0b' : '#10b981'} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontWeight: 'bold' }} />
                        </PieChart>
                     </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-6xl font-black text-white leading-none tracking-tighter">{data.length}</span>
                     <span className="text-[12px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">Estudiantes</span>
                  </div>
               </div>
            </div>

            {/* Listado Simplificado */}
            <div className="flex-1 min-h-0 flex flex-col gap-4 mt-2">
               <div className="flex-1 overflow-auto custom-scrollbar glass-card rounded-[48px] bg-black/20 border border-white/5">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#020617] text-[11px] font-black uppercase text-slate-500 border-b border-white/5 z-10">
                      <tr>
                        <th className="px-10 py-6 tracking-widest">Matrícula</th>
                        <th className="px-10 py-6 tracking-widest text-center">Promedio</th>
                        <th className="px-10 py-6 tracking-widest text-right">Riesgo Académico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredData.map((st, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                          <td className="px-10 py-6 font-black text-white text-lg tracking-tight group-hover:text-blue-400 transition-colors">{st.id_estudiante}</td>
                          <td className="px-10 py-6 font-black text-slate-400 text-center text-xl">{st.promedio_anterior?.toFixed(1)}</td>
                          <td className="px-10 py-6 text-right">
                            <span className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-xl ${st.prioridad === 'ALTO' ? 'bg-red-500 text-white' : st.prioridad === 'MEDIO' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
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
