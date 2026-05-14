"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ArrowLeft, Activity, User, Filter, GraduationCap, Calendar, Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

function DrillDownContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);
  const [localFilter, setLocalFilter] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });

  const carrera = searchParams.get("carrera") || "";
  const semestre = searchParams.get("semestre") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const query = `?carrera=${encodeURIComponent(carrera)}&semestre=${semestre}`;
        const res = await axios.get(`${API_URL}/drilldown/data${query}`);
        setData(res.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [carrera, semestre]);

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
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
               <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter">Explorador de Alumnos</h1>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Base de Datos ITNL</p>
            </div>
            <div className="h-10 w-[1px] bg-white/5 mx-2" />
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
               {['T', 'A', 'M', 'B'].map(f => (
                 <button key={f} onClick={() => setLocalFilter(f==='T'?'TODOS':f==='A'?'ALTO':f==='M'?'MEDIO':'BAJO')}
                   className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${localFilter.startsWith(f==='T'?'TOD':f) ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   {f==='T'?'TODOS':f==='A'?'ALTO':f==='M'?'MEDIO':'BAJO'}
                 </button>
               ))}
            </div>
         </div>
         <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl">
            <span className="text-[10px] font-black text-white italic">{sortedAndFilteredData.length} ESTUDIANTES ENCONTRADOS</span>
         </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
         <div className="flex-1 min-h-0 overflow-hidden glass-card rounded-[40px] bg-black/20 border border-white/5 flex flex-col shadow-2xl">
            <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-[#0f172a] text-[10px] font-black uppercase text-slate-500 border-b border-white/5 z-10 shadow-lg">
                   <tr>
                     <th onClick={() => handleSort('id_estudiante')} className="px-8 py-6 cursor-pointer hover:text-white transition-colors">
                        Identificador
                     </th>
                     <th onClick={() => handleSort('promedio_anterior')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                        Promedio
                     </th>
                     <th onClick={() => handleSort('porcentaje_asistencia')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                        Asistencia
                     </th>
                     <th onClick={() => handleSort('entregas_tareas_pct')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                        Tareas %
                     </th>
                     <th onClick={() => handleSort('materias_reprobadas_previas')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                        Reprobadas
                     </th>
                     <th onClick={() => handleSort('prioridad')} className="px-8 py-6 text-right cursor-pointer hover:text-white transition-colors">
                        Nivel de Riesgo
                     </th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {sortedAndFilteredData.map((st, idx) => (
                     <tr key={idx} className="hover:bg-white/5 transition-colors group">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 group-hover:text-blue-400 transition-all">
                                <User className="h-4 w-4" />
                             </div>
                             <span className="font-black text-white text-[14px] tracking-tight">{st.id_estudiante}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5 font-black text-slate-300 text-center text-sm">{(st.promedio_anterior || 0).toFixed(1)}</td>
                       <td className="px-6 py-5 text-center">
                          <span className={`text-[12px] font-black ${(st.porcentaje_asistencia || 0) < 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                             {(st.porcentaje_asistencia || 0).toFixed(0)}%
                          </span>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <span className="text-[12px] font-black text-slate-400">
                             {(st.entregas_tareas_pct || 0).toFixed(0)}%
                           </span>
                       </td>
                       <td className="px-6 py-5 text-center">
                          <span className={`text-[12px] font-black ${(st.materias_reprobadas_previas || 0) > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                             {st.materias_reprobadas_previas ?? 0}
                          </span>
                       </td>
                       <td className="px-8 py-5 text-right">
                         <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest ${st.prioridad === 'ALTO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : st.prioridad === 'MEDIO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
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
  );
}

export default function DrillDown() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-blue-500" /></div>}>
       <DrillDownContent />
    </Suspense>
  );
}
