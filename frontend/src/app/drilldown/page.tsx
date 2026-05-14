"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ArrowLeft, Activity, PieChart as PieIcon, 
  User, BookOpen, Clock, CheckCircle2, Briefcase,
  ChevronUp, ChevronDown, Filter, GraduationCap, Calendar, Search
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
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });

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

  const sortedAndFilteredData = useMemo(() => {
    let result = [...data];
    if (localFilter !== "TODOS") {
      result = result.filter(d => d.prioridad === localFilter);
    }
    
    if (sortConfig.key && sortConfig.direction) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? 0;
        const bVal = b[sortConfig.key] ?? 0;
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [data, localFilter, sortConfig]);

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

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-6 overflow-hidden bg-[#020617]">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-3 rounded-[16px] bg-white/5 hover:bg-white/10 text-slate-400">
             <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Explorador</h1>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Análisis ITNL</p>
          </div>
        </div>

        <div className="relative group">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
           <input 
             type="text" placeholder="BUSCAR MATRÍCULA..."
             value={selection.search}
             onChange={(e) => setSelection({...selection, search: e.target.value.toUpperCase()})}
             className="bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-[10px] font-black text-white outline-none focus:border-blue-500 w-48 transition-all"
           />
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
         
         <div className="lg:w-80 flex flex-col gap-4 shrink-0 h-full overflow-hidden">
            
            <div className="glass-card p-6 rounded-[40px] bg-slate-900/20 border border-white/5 flex flex-col h-[280px] shrink-0">
               <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                     <PieIcon className="h-4 w-4 text-blue-500" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-white">Estado</span>
                  </div>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                     {['T', 'A', 'M', 'B'].map(f => (
                       <button key={f} onClick={() => setLocalFilter(f==='T'?'TODOS':f==='A'?'ALTO':f==='M'?'MEDIO':'BAJO')}
                         className={`w-6 h-6 rounded-md text-[8px] font-black ${localFilter.startsWith(f==='T'?'TOD':f) ? 'bg-white text-black' : 'text-slate-500'}`}
                       >
                         {f}
                       </button>
                     ))}
                  </div>
               </div>
               
               <div className="flex-1 relative min-h-0 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={chartData} innerRadius={50} outerRadius={70} paddingAngle={10} dataKey="value" stroke="none">
                        {chartData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.name === 'ALTO' ? '#ef4444' : entry.name === 'MEDIO' ? '#f59e0b' : '#10b981'} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                     <span className="text-3xl font-black text-white">{data.length}</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 glass-card p-6 rounded-[40px] bg-blue-600/5 border border-white/5 flex flex-col min-h-0 overflow-hidden shadow-2xl">
               <div className="flex items-center gap-3 mb-4">
                  <Filter className="h-4 w-4 text-blue-400" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Filtros</span>
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 mb-4">
                  <div className="flex flex-col gap-1.5">
                     <button onClick={() => setSelection({...selection, carrera: ""})}
                        className={`px-4 py-3 rounded-2xl text-left text-[9px] font-black uppercase transition-all ${selection.carrera === "" ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                     >
                       TODAS LAS CARRERAS
                     </button>
                     {filters.carreras.map((c: string) => (
                        <button key={c} onClick={() => setSelection({ ...selection, carrera: c })}
                           className={`px-4 py-3 rounded-2xl text-left text-[9px] font-black uppercase transition-all ${selection.carrera === c ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                        >
                           {c}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="shrink-0 pt-4 border-t border-white/5">
                  <div className="grid grid-cols-5 gap-1.5">
                     <button onClick={() => setSelection({...selection, semestre: ""})}
                        className={`p-2 rounded-xl text-[9px] font-black uppercase transition-all ${selection.semestre === "" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500"}`}
                     >
                       ALL
                     </button>
                     {filters.semestres.map((s: number) => (
                        <button key={s} onClick={() => setSelection({ ...selection, semestre: selection.semestre === s.toString() ? "" : s.toString() })}
                           className={`p-2 rounded-xl text-[9px] font-black uppercase transition-all ${selection.semestre === s.toString() ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                        >
                           {s}°
                        </button>
                     ))}
                  </div>
               </div>
            </div>
         </div>

         <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-hidden glass-card rounded-[48px] bg-black/20 border border-white/5 flex flex-col shadow-2xl">
               <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0f172a] text-[10px] font-black uppercase text-slate-500 border-b border-white/5 z-10 shadow-lg">
                      <tr>
                        <th onClick={() => handleSort('id_estudiante')} className="px-6 py-6 cursor-pointer hover:text-white transition-colors">
                           Estudiante
                        </th>
                        <th onClick={() => handleSort('promedio_anterior')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                           Prom
                        </th>
                        <th onClick={() => handleSort('porcentaje_asistencia')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                           Asist %
                        </th>
                        <th onClick={() => handleSort('entregas_tareas_pct')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                           Tareas %
                        </th>
                        <th onClick={() => handleSort('materias_reprobadas_previas')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                           Previas
                        </th>
                        <th onClick={() => handleSort('prioridad')} className="px-6 py-6 text-right cursor-pointer hover:text-white transition-colors">
                           Riesgo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedAndFilteredData.map((st, idx) => (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 group-hover:text-blue-400 transition-all">
                                   <User className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-black text-white text-[13px] tracking-tight">{st.id_estudiante}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-400 text-center text-sm">{(st.promedio_anterior || 0).toFixed(1)}</td>
                          <td className="px-6 py-4 text-center">
                             <span className={`text-[11px] font-black ${(st.porcentaje_asistencia || 0) < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {(st.porcentaje_asistencia || 0).toFixed(0)}%
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className="text-[11px] font-black text-slate-400">
                                {(st.entregas_tareas_pct || 0).toFixed(0)}%
                              </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={`text-[11px] font-black ${(st.materias_reprobadas_previas || 0) > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                                {st.materias_reprobadas_previas ?? 0}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${st.prioridad === 'ALTO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : st.prioridad === 'MEDIO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
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
