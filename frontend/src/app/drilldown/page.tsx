"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import { 
  ArrowLeft, Activity, User, Filter, GraduationCap, Calendar, Search, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExplainerTrigger from "@/components/ExplainerTrigger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const isYes = (val: any) => {
  if (!val) return false;
  const n = String(val).trim().toUpperCase();
  return n === 'SI' || n === 'SÍ' || n.startsWith('S') || n.includes('S');
};

function DrillDownContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [data, setData] = useState<any[]>([]);
  const [localFilter, setLocalFilter] = useState("TODOS");
  const [loading, setLoading] = useState(true);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | null }>({ key: '', direction: null });
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

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
                <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                   Explorador de Alumnos
                   <ExplainerTrigger id="tabla_estudiantes" />
                </h1>
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Base de Datos ITNL</p>
             </div>
             <div className="h-10 w-[1px] bg-white/5 mx-2" />
             <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                {['T', 'A', 'M', 'B'].map(f => (
                  <button key={f} onClick={() => setLocalFilter(f==='T'?'TODOS':f==='A'?'ALTO':f==='M'?'MEDIO':'BAJO')}
                    className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${localFilter.startsWith(f==='T'?'TOD':f) ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {f==='T'?'TODOS':f==='A'?'ALTO':f==='M'?'MEDIO':'BAJO'}
                  </button>
                ))}
                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                <ExplainerTrigger id="filtro_prioridad" className="!bg-transparent hover:!bg-white/10" />
             </div>
         </div>
         <div className="bg-blue-600/10 border border-blue-500/20 px-4 py-2 rounded-xl">
            <span className="text-xs font-black text-white italic">{sortedAndFilteredData.length} ESTUDIANTES ENCONTRADOS</span>
         </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
         <div className="flex-1 min-h-0 overflow-hidden glass-card rounded-[40px] bg-black/20 border border-white/5 flex flex-col shadow-2xl">
            <div className="flex-1 overflow-auto custom-scrollbar">
               <table className="w-full text-left border-collapse">
                 <thead className="sticky top-0 bg-[#0f172a] text-xs font-black uppercase text-slate-300 border-b border-white/5 z-10 shadow-lg">
                   <tr>
                     <th onClick={() => handleSort('id_estudiante')} className="px-8 py-6 cursor-pointer hover:text-white transition-colors">
                        Identificador
                     </th>
                     <th onClick={() => handleSort('carrera')} className="px-6 py-6 cursor-pointer hover:text-white transition-colors">
                        Carrera
                     </th>
                     <th onClick={() => handleSort('promedio_anterior')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                        Promedio
                     </th>
                     <th onClick={() => handleSort('porcentaje_asistencia')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                        Asistencia
                     </th>
                      <th onClick={() => handleSort('prob_reprobacion')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                         Riesgo Reprob.
                      </th>
                      <th onClick={() => handleSort('prob_desercion')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                         Riesgo Deserc.
                      </th>
                      <th onClick={() => handleSort('motivo_principal')} className="px-6 py-6 text-center cursor-pointer hover:text-white transition-colors">
                         Motivo Alerta
                      </th>
                      <th onClick={() => handleSort('prioridad')} className="px-8 py-6 text-right cursor-pointer hover:text-white transition-colors">
                         Nivel de Riesgo
                      </th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/5">
                   {sortedAndFilteredData.map((st, idx) => (
                     <tr key={idx} onClick={() => setSelectedStudent(st)} className="hover:bg-white/5 transition-colors group cursor-pointer">
                       <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                             <div className="p-2.5 rounded-xl bg-white/5 text-slate-500 group-hover:text-blue-400 transition-all">
                                <User className="h-4 w-4" />
                             </div>
                             <span className="font-black text-white text-[14px] tracking-tight">{st.id_estudiante}</span>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <span className="text-xs font-black text-slate-300 uppercase tracking-tight line-clamp-1">
                             {st.carrera?.replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã\xad/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ')}
                          </span>
                       </td>
                       <td className="px-6 py-5 font-black text-white text-center text-base">{(st.promedio_anterior || 0).toFixed(1)}</td>
                        <td className="px-6 py-5 text-center">
                           <span className={`text-sm font-black ${(st.porcentaje_asistencia || 0) < 70 ? 'text-red-400' : (st.porcentaje_asistencia || 0) < 80 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {(st.porcentaje_asistencia || 0).toFixed(0)}%
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`text-sm font-black ${(st.prob_reprobacion || 0) > 50 ? 'text-red-400' : (st.prob_reprobacion || 0) > 20 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {(st.prob_reprobacion || 0).toFixed(0)}%
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`text-sm font-black ${(st.prob_desercion || 0) > 50 ? 'text-red-400' : (st.prob_desercion || 0) > 20 ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {(st.prob_desercion || 0).toFixed(0)}%
                           </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                           <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider ${st.motivo_principal === 'Estable' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                              {st.motivo_principal}
                           </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest ${st.prioridad === 'ALTO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : st.prioridad === 'MEDIO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
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

      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedStudent(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-card max-w-2xl w-full bg-slate-950/95 border border-white/10 rounded-[32px] p-6 md:p-8 flex flex-col gap-6 relative shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedStudent(null); }}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-start gap-4">
                <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Perfil Detallado de Alumno</p>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tight">{selectedStudent.id_estudiante}</h2>
                  <p className="text-xs font-bold text-slate-300 uppercase mt-1 italic">
                    {selectedStudent.carrera?.replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã\xad/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Estatus</span>
                  <span className="px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Activo
                  </span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center relative group">
                  <div className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
                    <ExplainerTrigger id="predict_simulador" className="!p-1 hover:bg-white/10 rounded-lg" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Riesgo IA</span>
                  <span className={`px-3 py-1 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest ${selectedStudent.prioridad === 'ALTO' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : selectedStudent.prioridad === 'MEDIO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                    {selectedStudent.prioridad}
                  </span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center relative group">
                  <div className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
                    <ExplainerTrigger id="predict_simulador" className="!p-1 hover:bg-white/10 rounded-lg" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Riesgo Reprob.</span>
                  <span className={`text-base font-black ${(selectedStudent.prob_reprobacion || 0) > 50 ? 'text-red-400' : (selectedStudent.prob_reprobacion || 0) > 20 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {(selectedStudent.prob_reprobacion || 0).toFixed(0)}%
                  </span>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center items-center text-center relative group">
                  <div className="absolute top-2 right-2 opacity-60 hover:opacity-100 transition-opacity">
                    <ExplainerTrigger id="predict_simulador" className="!p-1 hover:bg-white/10 rounded-lg" />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Riesgo Deserc.</span>
                  <span className={`text-base font-black ${(selectedStudent.prob_desercion || 0) > 50 ? 'text-red-400' : (selectedStudent.prob_desercion || 0) > 20 ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {(selectedStudent.prob_desercion || 0).toFixed(0)}%
                  </span>
                </div>
              </div>

              {selectedStudent.motivo_principal !== "Estable" && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-amber-400 uppercase tracking-wider leading-none mb-1">Motivo Principal de Riesgo</p>
                    <p className="text-sm font-black text-slate-200 uppercase">{selectedStudent.motivo_principal}</p>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Métricas Académicas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Promedio", val: `${(selectedStudent.promedio_anterior || 0).toFixed(1)}`, color: "text-white" },
                    { label: "Asistencia", val: `${(selectedStudent.porcentaje_asistencia || 0).toFixed(0)}%`, color: (selectedStudent.porcentaje_asistencia || 0) < 70 ? "text-red-400" : (selectedStudent.porcentaje_asistencia || 0) < 80 ? "text-orange-400" : "text-emerald-400" },
                    { label: "Entregas Tareas", val: `${(selectedStudent.entregas_tareas_pct || 0).toFixed(0)}%`, color: (selectedStudent.entregas_tareas_pct || 0) < 70 ? "text-red-400" : (selectedStudent.entregas_tareas_pct || 0) < 80 ? "text-orange-400" : "text-emerald-400" },
                    { label: "Reprobadas Previas", val: `${selectedStudent.materias_reprobadas_previas ?? 0}`, color: (selectedStudent.materias_reprobadas_previas || 0) > 0 ? "text-amber-500" : "text-slate-400" }
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{item.label}</span>
                      <span className={`text-xl font-black ${item.color}`}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Entorno Estudiantil</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "Edad", val: `${selectedStudent.edad || "N/A"} años` },
                    { label: "Género", val: selectedStudent.genero === "F" || selectedStudent.genero === "Femenino" ? "Femenino" : "Masculino" },
                    { label: "Situación Laboral", val: selectedStudent.trabaja || "No trabaja" },
                    { label: "Distancia Campus", val: `${(selectedStudent.distancia_km || 0).toFixed(1)} km` },
                    { label: "Apoyo de Beca", val: isYes(selectedStudent.beca) ? "Sí tiene" : "No tiene" },
                    { label: "Acceso Internet", val: isYes(selectedStudent.acceso_internet) ? "Sí tiene" : "No tiene" },
                    { label: "Horas Trabajo", val: `${selectedStudent.horas_trabajo_semana || 0} hrs/sem` },
                    { label: "Uso Plataforma", val: `${(selectedStudent.uso_plataforma_semana || 0).toFixed(1)} hrs/sem` },
                    { label: "Participa Tutoría", val: isYes(selectedStudent.participa_tutorias) ? "Sí" : "No" }
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/50 p-4 rounded-2xl border border-white/5 flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">{item.label}</span>
                      <span className="text-sm font-black text-slate-200">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-600/10 border border-blue-500/20 p-4 rounded-2xl text-center">
                <p className="text-xs font-bold text-slate-300 uppercase italic">
                  Visualización individualizada para intervención psicopedagógica y canalización de tutorías.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
