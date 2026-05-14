"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ArrowLeft, Activity, PieChart as PieIcon, 
  User, BookOpen, Clock, CheckCircle2, Briefcase,
  ChevronUp, ChevronDown, Filter, GraduationCap, Calendar
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
      <header className="flex items-center gap-4 shrink-0">
        <button onClick={() => router.push("/")} className="p-3 rounded-[16px] bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
           <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Explorador de Datos</h1>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Análisis Granular ITNL</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
         {/* Sidebar Chart remains as requested */}
         <div className="lg:w-72 flex flex-col gap-4 shrink-0 h-full overflow-hidden">
            <div className="glass-card p-6 rounded-[40px] bg-slate-900/20 border border-white/5 relative flex flex-col h-full overflow-hidden">
               <div className="flex items-center gap-3 mb-6 text-slate-400">
                  <PieIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Estado de Riesgo</span>
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

               <div className="mt-4 space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {['TODOS', 'ALTO', 'MEDIO', 'BAJO'].map(f => (
                    <button key={f} onClick={() => setLocalFilter(f)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${localFilter === f ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                    >
                       <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${f === 'ALTO' ? 'bg-red-500' : f === 'MEDIO' ? 'bg-amber-500' : f === 'BAJO' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                          <span className="text-[9px] font-black uppercase">{f}</span>
                       </div>
                       {f !== 'TODOS' && <span className="text-xs font-bold">{chartData.find(d => d.name === f)?.value || 0}</span>}
                    </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
            
            {/* THE ESSENCE: Visual Drill-Down Step Filters ABOVE table */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
               {/* Step 1: Carrera Selection */}
               <div className="glass-card p-5 rounded-[32px] bg-blue-600/5 border border-white/5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                     <GraduationCap className="h-4 w-4 text-blue-400" />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paso 1: Carrera</span>
                  </div>
                  <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                     <div className="flex gap-2 min-w-max">
                        <button onClick={() => setSelection({...selection, carrera: ""})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selection.carrera === "" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                        >
                          TODAS
                        </button>
                        {filters.carreras.map((c: string) => (
                          <button key={c} onClick={() => setSelection({ ...selection, carrera: c })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap ${selection.carrera === c ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                          >
                            {c}
                          </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* Step 2: Semestre Selection */}
               <div className="glass-card p-5 rounded-[32px] bg-indigo-600/5 border border-white/5 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                     <Calendar className="h-4 w-4 text-indigo-400" />
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Paso 2: Semestre</span>
                  </div>
                  <div className="flex-1 overflow-x-auto custom-scrollbar pb-2">
                     <div className="flex gap-2 min-w-max">
                        <button onClick={() => setSelection({...selection, semestre: ""})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selection.semestre === "" ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                        >
                          TODOS
                        </button>
                        {filters.semestres.map((s: number) => (
                          <button key={s} onClick={() => setSelection({ ...selection, semestre: selection.semestre === s.toString() ? "" : s.toString() })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${selection.semestre === s.toString() ? "bg-indigo-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                          >
                            {s}°
                          </button>
                        ))}
                     </div>
                  </div>
               </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 min-h-0 overflow-hidden glass-card rounded-[40px] bg-black/20 border border-white/5 flex flex-col shadow-2xl">
               <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0f172a] text-[10px] font-black uppercase text-slate-500 border-b border-white/5 z-10 shadow-lg">
                      <tr>
                        <th onClick={() => handleSort('id_estudiante')} className="px-6 py-5 cursor-pointer hover:text-white transition-colors">
                           <div className="flex items-center gap-2">Estudiante {sortConfig.key === 'id_estudiante' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th onClick={() => handleSort('promedio_anterior')} className="px-6 py-5 text-center cursor-pointer hover:text-white transition-colors">
                           <div className="flex items-center justify-center gap-2">Prom {sortConfig.key === 'promedio_anterior' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th onClick={() => handleSort('porcentaje_asistencia')} className="px-6 py-5 text-center cursor-pointer hover:text-white transition-colors">
                           <div className="flex items-center justify-center gap-2">Asist % {sortConfig.key === 'porcentaje_asistencia' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th onClick={() => handleSort('entregas_tareas_pct')} className="px-6 py-5 text-center cursor-pointer hover:text-white transition-colors">
                           <div className="flex items-center justify-center gap-2">Tareas % {sortConfig.key === 'entregas_tareas_pct' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th onClick={() => handleSort('materias_reprobadas_previas')} className="px-6 py-5 text-center cursor-pointer hover:text-white transition-colors">
                           <div className="flex items-center justify-center gap-2">Previas {sortConfig.key === 'materias_reprobadas_previas' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th onClick={() => handleSort('prioridad')} className="px-6 py-5 text-right cursor-pointer hover:text-white transition-colors">
                           <div className="flex items-center justify-end gap-2">Riesgo {sortConfig.key === 'prioridad' && (sortConfig.direction === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {sortedAndFilteredData.map((st, idx) => {
                        return (
                          <tr key={idx} className="hover:bg-white/5 transition-colors group">
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-white/5 text-slate-500 group-hover:text-blue-400 transition-all">
                                     <User className="h-3 w-3" />
                                  </div>
                                  <span className="font-black text-white text-xs tracking-tight">{st.id_estudiante}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 font-black text-slate-400 text-center text-sm">{(st.promedio_anterior || 0).toFixed(1)}</td>
                            <td className="px-6 py-4 text-center">
                               <span className={`text-[10px] font-black ${(st.porcentaje_asistencia || 0) < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {(st.porcentaje_asistencia || 0).toFixed(0)}%
                               </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className="text-[10px] font-black text-slate-400">
                                  {(st.entregas_tareas_pct || 0).toFixed(0)}%
                                </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <span className={`text-[10px] font-black ${(st.materias_reprobadas_previas || 0) > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                                  {st.materias_reprobadas_previas ?? 0}
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${st.prioridad === 'ALTO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : st.prioridad === 'MEDIO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                                 {st.prioridad}
                               </span>
                            </td>
                          </tr>
                        );
                      })}
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
