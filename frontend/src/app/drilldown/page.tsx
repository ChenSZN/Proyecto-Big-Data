"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  RefreshCcw, GraduationCap, Layers, Shield, BrainCircuit,
  PieChart as PieIcon, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from 'recharts';

const API_URL = "http://localhost:8001/api";
const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export default function DrillDown() {
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<any>({ carreras: [], semestres: [] });
  const [selection, setSelection] = useState({ carrera: "", semestre: "", search_id: "" });
  const [localFilter, setLocalFilter] = useState("TODOS");
  const [data, setData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchFilters();
    fetchInitialData();
  }, []);

  const fetchFilters = async (carrera?: string) => {
    try {
      const res = await axios.get(`${API_URL}/drilldown/filters`, { params: { carrera: carrera || null } });
      if (res.data) setFilters(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [resData, resInsights] = await Promise.all([
        axios.get(`${API_URL}/drilldown/data`),
        axios.get(`${API_URL}/drilldown/insights`)
      ]);
      setData(resData.data);
      setInsights(resInsights.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (mounted) fetchFilters(selection.carrera);
  }, [selection.carrera, mounted]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selection.carrera && !selection.semestre && !selection.search_id) return;
      setLoading(true);
      try {
        const [resData, resInsights] = await Promise.all([
          axios.get(`${API_URL}/drilldown/data`, { params: { carrera: selection.carrera || null, semestre: selection.semestre || null, search_id: selection.search_id || null } }),
          axios.get(`${API_URL}/drilldown/insights`, { params: { carrera: selection.carrera || null, semestre: selection.semestre || null } })
        ]);
        setData(resData.data);
        setInsights(resInsights.data);
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    const timer = setTimeout(fetchData, 200);
    return () => clearTimeout(timer);
  }, [selection]);

  const filteredData = useMemo(() => {
    if (localFilter === "TODOS") return data;
    return data.filter(d => d.prioridad === localFilter);
  }, [data, localFilter]);

  const chartData = useMemo(() => {
    const counts: any = { 'ALTO': 0, 'MEDIO': 0, 'BAJO': 0 };
    data.forEach(d => { if (counts[d.prioridad] !== undefined) counts[d.prioridad]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  if (!mounted) return null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 pb-20">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-8">
        <div className="space-y-2">
           <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-tight">
             Explorador <span className="text-blue-600 font-light not-italic tracking-normal">Académico</span>
           </h1>
           <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
              <BrainCircuit className="h-4 w-4 text-blue-500" /> Sincronizado con Dataset ITNL
           </div>
        </div>
        <div className="flex items-center gap-4">
           <input 
              type="text" placeholder="Matrícula..." value={selection.search_id}
              onChange={(e) => setSelection({...selection, search_id: e.target.value.toUpperCase()})}
              className="bg-slate-900/50 border border-white/5 rounded-[24px] px-8 py-5 text-sm font-bold text-white outline-none w-[300px]"
           />
           <button onClick={() => { setSelection({ carrera: "", semestre: "", search_id: "" }); setLocalFilter("TODOS"); fetchInitialData(); }}
             className="p-5 rounded-[24px] bg-white/5 border border-white/10 text-slate-500 hover:bg-red-500 hover:text-white transition-all shadow-xl"
           >
              <RefreshCcw className="h-6 w-6" />
           </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-3 space-y-6">
           <div className="glass-card rounded-[40px] p-10 border border-white/5 bg-slate-900/30">
              <div className="flex items-center gap-3 mb-8">
                 <GraduationCap className="h-5 w-5 text-blue-500" />
                 <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Carrera ({filters.carreras.length})</p>
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                 {filters.carreras.map((c: string) => (
                   <button key={c} onClick={() => setSelection({ ...selection, carrera: selection.carrera === c ? "" : c, semestre: "" })}
                     className={`w-full flex items-center justify-between p-5 rounded-2xl transition-all border-2 ${selection.carrera === c ? "bg-blue-600 border-blue-400 text-white shadow-xl" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"}`}
                   >
                     <span className="text-[10px] font-black uppercase text-left leading-tight pr-4">{c}</span>
                     {selection.carrera === c ? <Shield className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 opacity-20" />}
                   </button>
                 ))}
              </div>
           </div>

           <AnimatePresence>
             {selection.carrera && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-[40px] p-10 border border-white/5 bg-slate-900/30">
                  <div className="flex items-center gap-3 mb-8">
                     <Layers className="h-5 w-5 text-indigo-500" />
                     <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">Semestre ({filters.semestres.length})</p>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                     {filters.semestres.map((s: number) => (
                       <button key={s} onClick={() => setSelection({ ...selection, semestre: selection.semestre === s.toString() ? "" : s.toString() })}
                         className={`py-5 rounded-2xl font-black text-sm transition-all border-2 ${selection.semestre === s.toString() ? "bg-indigo-600 border-indigo-400 text-white shadow-xl" : "bg-white/5 border-transparent text-slate-500 hover:bg-white/10"}`}
                       >
                         {s}°
                       </button>
                     ))}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        <div className="lg:col-span-9 space-y-10">
           <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="glass-card p-8 rounded-[40px] border border-white/5 min-h-[350px]">
                 <div className="flex items-center gap-3 mb-6 text-slate-500"><PieIcon className="h-5 w-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Resumen</span></div>
                 <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                 </div>
              </div>

              <div className="xl:col-span-2 glass-card p-8 rounded-[40px] border border-white/5 min-h-[350px]">
                 <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 text-slate-500"><BrainCircuit className="h-5 w-5" /> <span className="text-[10px] font-black uppercase tracking-widest">Factores de Riesgo (ML)</span></div>
                 </div>
                 <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={insights}>
                        <PolarGrid stroke="#ffffff10" />
                        <PolarAngleAxis dataKey="subject" tick={{fill: '#475569', fontSize: 9, fontWeight: 'bold'}} />
                        <Radar name="Influencia" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 px-6">
                 <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Estudiantes ({filteredData.length})</h2>
                 <div className="flex items-center gap-2 bg-white/5 p-2 rounded-[24px] border border-white/10 overflow-x-auto max-w-full">
                    {['TODOS', 'ALTO', 'MEDIO', 'BAJO'].map(f => (
                      <button key={f} onClick={() => setLocalFilter(f)}
                        className={`px-6 py-3 rounded-[18px] text-[9px] font-black transition-all whitespace-nowrap ${localFilter === f ? 'bg-white text-black shadow-lg' : 'text-slate-500 hover:text-slate-200'}`}
                      >
                        {f}
                      </button>
                    ))}
                 </div>
              </div>

              <div className="rounded-[40px] border border-white/5 bg-black/40 backdrop-blur-3xl overflow-hidden shadow-2xl">
                 <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left min-w-[900px]">
                      <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <tr>
                          <th className="px-10 py-8">Matrícula</th>
                          <th className="px-10 py-8 text-center">Rendimiento</th>
                          <th className="px-10 py-8">Carrera</th>
                          <th className="px-10 py-8 text-right">Riesgo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredData.map((st, idx) => (
                          <tr key={`${st.id_estudiante}-${idx}`} className="hover:bg-white/5 transition-all">
                            <td className="px-10 py-8 font-black text-white text-lg">{st.id_estudiante}</td>
                            <td className="px-10 py-8">
                               <div className="flex justify-center gap-8">
                                  <div className="text-center">
                                     <p className="text-xl font-black text-white">{st.promedio_anterior?.toFixed(1)}</p>
                                     <p className="text-[8px] text-slate-600 font-black uppercase">Prom</p>
                                  </div>
                                  <div className="text-center">
                                     <p className="text-xl font-black text-white">{st.porcentaje_asistencia?.toFixed(1)}%</p>
                                     <p className="text-[8px] text-slate-600 font-black uppercase">Asist</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-10 py-8 text-[11px] font-bold text-slate-400 uppercase max-w-[250px] truncate">{st.carrera}</td>
                            <td className="px-10 py-8 text-right">
                               <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${st.prioridad === 'ALTO' ? 'bg-red-500 text-white' : st.prioridad === 'MEDIO' ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
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
