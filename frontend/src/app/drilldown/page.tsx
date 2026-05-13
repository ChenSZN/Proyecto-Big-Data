"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ChevronRight, Search, Filter, GraduationCap, 
  Layers, Shield, Activity, PieChart as PieIcon, 
  BrainCircuit, ArrowLeft, Download, Share2
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
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

        // Update URL without refresh
        const newUrl = `/drilldown?${params.toString()}`;
        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [selection]);

  const filteredData = useMemo(() => {
    if (localFilter === "TODOS") return data;
    return data.filter(d => d.prioridad === localFilter);
  }, [data, localFilter]);

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

  const insights = useMemo(() => {
    if (data.length === 0) return [];
    return [
      { subject: 'Asistencia', A: data.reduce((a, b) => a + (b.porcentaje_asistencia || 0), 0) / data.length },
      { subject: 'Promedio', A: (data.reduce((a, b) => a + (b.promedio_anterior || 0), 0) / data.length) * 10 },
      { subject: 'Plataforma', A: data.reduce((a, b) => a + (b.uso_plataforma || 0), 0) / data.length },
      { subject: 'Entregas', A: 75 },
      { subject: 'Participación', A: 60 }
    ];
  }, [data]);

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-slate-400">
             <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic leading-tight">
              Explorador <span className="text-blue-600 font-light not-italic tracking-normal">Académico</span>
            </h1>
            <div className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] flex items-center gap-3">
               Sincronizado con Dataset ITNL
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Matrícula..." 
                defaultValue={selection.search}
                onKeyDown={(e: any) => e.key === 'Enter' && setSelection({...selection, search: e.target.value})}
                className="bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-[240px] transition-all"
              />
           </div>
           <button className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400"><Share2 className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-3 flex flex-col gap-4 min-h-0">
           <div className="glass-card rounded-[32px] p-6 border border-white/5 bg-slate-900/30 flex flex-col min-h-0">
              <div className="flex items-center gap-3 mb-6 shrink-0">
                 <GraduationCap className="h-4 w-4 text-blue-500" />
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Carrera ({filters.carreras.length})</p>
              </div>
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1.5">
                 {filters.carreras.map((c: string) => (
                   <button key={c} onClick={() => setSelection({ ...selection, carrera: selection.carrera === c ? "" : c, semestre: "" })}
                     className={`w-full flex items-center justify-between p-4 rounded-xl transition-all border-2 ${selection.carrera === c ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"}`}
                   >
                     <span className="text-[9px] font-black uppercase text-left leading-tight pr-3">{c}</span>
                     {selection.carrera === c ? <Shield className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5 opacity-20" />}
                   </button>
                 ))}
              </div>
           </div>

           <AnimatePresence>
             {selection.carrera && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[32px] p-6 border border-white/5 bg-slate-900/30 shrink-0">
                  <div className="flex items-center gap-3 mb-6">
                     <Layers className="h-4 w-4 text-indigo-500" />
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Semestre ({filters.semestres.length})</p>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                     {filters.semestres.map((s: number) => (
                       <button key={s} onClick={() => setSelection({ ...selection, semestre: selection.semestre === s.toString() ? "" : s.toString() })}
                         className={`py-4 rounded-xl font-black text-xs transition-all border-2 ${selection.semestre === s.toString() ? "bg-indigo-600 border-indigo-400 text-white shadow-xl" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"}`}
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
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0 h-[320px]">
              {/* Resumen de Riesgo (Donut) */}
              <div className="glass-card p-6 rounded-[32px] border border-white/5 flex flex-col min-h-0 bg-slate-900/20 relative group overflow-hidden">
                 <div className="flex items-center gap-3 mb-4 text-slate-500 shrink-0">
                    <PieIcon className="h-4 w-4 text-blue-500" /> 
                    <span className="text-xs font-black uppercase tracking-widest">Resumen de Riesgo</span>
                 </div>
                 <div className="flex-1 min-h-0 relative">
                    {data.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie 
                              data={chartData} 
                              innerRadius={65} 
                              outerRadius={85} 
                              paddingAngle={8} 
                              dataKey="value" 
                              stroke="none"
                              animationDuration={1500}
                            >
                              {chartData.map((entry) => (
                                <Cell key={`cell-${entry.name}`} fill={entry.name === 'ALTO' ? '#ef4444' : entry.name === 'MEDIO' ? '#f59e0b' : '#10b981'} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '12px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                           <span className="text-3xl font-black text-white leading-none">{data.length}</span>
                           <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Alumnos</span>
                        </div>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <div className="text-center">
                            <PieIcon className="h-10 w-10 mx-auto mb-2" />
                            <p className="text-[10px] font-black uppercase">Sin Datos</p>
                         </div>
                      </div>
                    )}
                 </div>
              </div>

              {/* Factores de Riesgo (Radar) */}
              <div className="xl:col-span-2 glass-card p-6 rounded-[32px] border border-white/5 flex flex-col min-h-0 bg-slate-900/20">
                 <div className="flex items-center justify-between mb-4 shrink-0">
                    <div className="flex items-center gap-3 text-slate-500">
                       <BrainCircuit className="h-4 w-4 text-indigo-500" /> 
                       <span className="text-xs font-black uppercase tracking-widest">Diagnóstico de Factores Críticos</span>
                    </div>
                 </div>
                 <div className="flex-1 min-h-0 relative">
                    {insights.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={insights}>
                          <PolarGrid stroke="#ffffff10" />
                          <PolarAngleAxis dataKey="subject" tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} />
                          <Radar 
                            name="Impacto" 
                            dataKey="A" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.4} 
                            strokeWidth={3}
                          />
                          <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '12px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                         <BrainCircuit className="h-12 w-12" />
                      </div>
                    )}
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-4 flex-1 min-h-0">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 px-4 shrink-0">
                 <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Estudiantes ({filteredData.length})</h2>
                 <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[18px] border border-white/10 overflow-x-auto">
                    {['TODOS', 'ALTO', 'MEDIO', 'BAJO'].map(f => (
                      <button key={f} onClick={() => setLocalFilter(f)}
                        className={`px-4 py-2 rounded-[14px] text-[10px] font-black transition-all whitespace-nowrap ${localFilter === f ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="flex-1 min-h-0 rounded-[32px] border border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden shadow-2xl flex flex-col">
                 <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[800px]">
                      <thead className="sticky top-0 bg-[#0f172a] z-10 text-xs font-black uppercase tracking-widest text-slate-500 border-b border-white/5">
                        <tr>
                          <th className="px-8 py-6">Matrícula</th>
                          <th className="px-8 py-6 text-center">Rendimiento</th>
                          <th className="px-8 py-6">Carrera</th>
                          <th className="px-8 py-6 text-right">Riesgo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredData.map((st, idx) => (
                          <tr key={`${st.id_estudiante}-${idx}`} className="hover:bg-white/5 transition-all">
                            <td className="px-8 py-6 font-black text-white text-lg tracking-tight">{st.id_estudiante}</td>
                            <td className="px-8 py-6">
                               <div className="flex justify-center gap-10">
                                  <div className="text-center">
                                     <p className="text-xl font-black text-white">{st.promedio_anterior?.toFixed(1)}</p>
                                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Promedio</p>
                                  </div>
                                  <div className="text-center">
                                     <p className="text-xl font-black text-white">{st.porcentaje_asistencia?.toFixed(1)}%</p>
                                     <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Asistencia</p>
                                  </div>
                                </div>
                            </td>
                            <td className="px-8 py-6 text-xs font-bold text-slate-400 uppercase max-w-[250px] truncate">{st.carrera}</td>
                            <td className="px-8 py-6 text-right">
                               <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${st.prioridad === 'ALTO' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : st.prioridad === 'MEDIO' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'}`}>
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
    </div>
  );
}

export default function DrillDown() {
  return (
    <Suspense fallback={
      <div className="h-full flex items-center justify-center">
        <Activity className="h-10 w-10 text-blue-500 animate-spin" />
      </div>
    }>
      <DrillDownContent />
    </Suspense>
  );
}
