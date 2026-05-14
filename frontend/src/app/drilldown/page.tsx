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
    <div className="p-4 md:p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex items-center gap-4 shrink-0">
        <button onClick={() => router.push("/")} className="p-3 rounded-[16px] bg-white/5 hover:bg-white/10 text-slate-400">
           <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Explorador de Datos</h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Análisis Granular ITNL</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
         {/* Filtros Lateral - Compacted */}
         <div className="lg:w-64 flex flex-col gap-4 shrink-0 h-fit">
            <AnimatePresence>
              {!selection.carrera && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-[32px] bg-blue-600/5 border border-white/5">
                   <p className="text-[9px] font-black text-blue-400 uppercase mb-4">Seleccionar Carrera</p>
                   <div className="grid grid-cols-1 gap-1">
                      {filters.carreras.map((c: string) => (
                        <button key={c} onClick={() => setSelection({ ...selection, carrera: c })}
                          className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-left text-[10px] font-black uppercase tracking-tight"
                        >
                          {c}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
              {selection.carrera && (
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="glass-card p-6 rounded-[32px] bg-blue-600/10 border border-blue-500/20">
                   <div className="flex justify-between items-center mb-4">
                      <p className="text-[9px] font-black text-white uppercase truncate">{selection.carrera}</p>
                      <button onClick={() => setSelection({ carrera: "", semestre: "", search: "" })} className="text-[9px] font-black text-blue-400 underline">X</button>
                   </div>
                   <div className="grid grid-cols-4 gap-1">
                      {filters.semestres.map((s: number) => (
                        <button key={s} onClick={() => setSelection({ ...selection, semestre: selection.semestre === s.toString() ? "" : s.toString() })}
                          className={`py-2 rounded-lg font-black text-[10px] ${selection.semestre === s.toString() ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500"}`}
                        >
                          {s}
                        </button>
                      ))}
                   </div>
                </motion.div>
              )}
            </AnimatePresence>
         </div>

         <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Gráfica de Resumen - Reduced Size to favor Table */}
            <div className="glass-card p-6 rounded-[40px] bg-slate-900/20 border border-white/5 relative flex flex-col h-[220px] lg:h-[250px] shrink-0">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 text-slate-400">
                     <PieIcon className="h-4 w-4 text-blue-500" />
                     <span className="text-[10px] font-black uppercase tracking-widest text-white">Distribución de Riesgo</span>
                  </div>
                  <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl">
                     {['TODOS', 'ALTO', 'MEDIO', 'BAJO'].map(f => (
                       <button key={f} onClick={() => setLocalFilter(f)}
                         className={`px-3 py-1.5 rounded-lg text-[9px] font-black ${localFilter === f ? 'bg-white text-black' : 'text-slate-500'}`}
                       >
                         {f}
                       </button>
                     ))}
                  </div>
               </div>
               
               <div className="flex-1 relative min-h-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={50} outerRadius={75} paddingAngle={8} dataKey="value" stroke="none">
                        {chartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.name === 'ALTO' ? '#ef4444' : entry.name === 'MEDIO' ? '#f59e0b' : '#10b981'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                     <span className="text-3xl font-black text-white">{data.length}</span>
                     <span className="text-[9px] font-black text-slate-500 uppercase">Total</span>
                  </div>
               </div>
            </div>

            {/* Listado - MAXIMIZED */}
            <div className="flex-1 min-h-0 overflow-hidden glass-card rounded-[40px] bg-black/20 border border-white/5 flex flex-col">
               <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="sticky top-0 bg-[#0f172a] text-[10px] font-black uppercase text-slate-500 border-b border-white/5 z-10">
                      <tr>
                        <th className="px-8 py-5">Matrícula</th>
                        <th className="px-8 py-5 text-center">Promedio</th>
                        <th className="px-8 py-5 text-right">Prioridad</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredData.map((st, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-8 py-4 font-black text-white text-base">{st.id_estudiante}</td>
                          <td className="px-8 py-4 font-black text-slate-400 text-center text-lg">{st.promedio_anterior?.toFixed(1)}</td>
                          <td className="px-8 py-4 text-right">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${st.prioridad === 'ALTO' ? 'bg-red-500' : st.prioridad === 'MEDIO' ? 'bg-orange-500' : 'bg-emerald-500'}`}>
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
