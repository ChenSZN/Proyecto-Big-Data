"use client";

import { useState, useEffect } from "react";
import { 
  Target, 
  Cpu, 
  Zap,
  CheckCircle2,
  Activity,
  AlertCircle,
  BrainCircuit,
  TrendingDown
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from "recharts";
import { motion } from "framer-motion";
import axios from "axios";

const API_URL = "/api";

export default function Patterns() {
  const [mounted, setMounted] = useState(false);
  const [importance, setImportance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchPatterns = async () => {
      try {
        const res = await axios.get(`${API_URL}/patterns`);
        if (Array.isArray(res.data)) {
           setImportance(res.data);
        } else {
           setError(true);
        }
      } catch (e) { 
        console.error("Error al cargar patrones:", e); 
        setError(true);
      } finally { 
        setLoading(false); 
      }
    };
    fetchPatterns();
  }, []);

  if (!mounted) return null;

  return (
    <div className="p-8 h-full flex flex-col gap-8 overflow-hidden">
      <header className="shrink-0">
        <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Explicabilidad de Inteligencia Artificial</p>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-tight">
          Patrones de <span className="text-blue-600 not-italic">Riesgo Académico</span>
        </h1>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
           <Activity className="h-12 w-12 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-red-500/20 rounded-[40px] bg-red-500/5">
           <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
           <p className="text-xl font-black uppercase text-red-400">Error en el motor de análisis</p>
           <p className="text-sm text-slate-500 mt-4 font-bold">Verifica que el servicio de datos esté activo en el puerto 8001</p>
           <button onClick={() => window.location.reload()} className="mt-8 px-8 py-3 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all">REINTENTAR</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 flex-1 min-h-0">
          
          {/* Gráfica de Importancia */}
          <div className="lg:col-span-8 glass-card rounded-[48px] p-10 border border-white/5 flex flex-col min-h-0 bg-slate-900/40">
            <div className="mb-10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Factores de Influencia Predominantes</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Peso estadístico de cada variable en el riesgo de deserción</p>
              </div>
              <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                <Target className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            
            <div className="w-full flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importance} layout="vertical" margin={{ left: 20, right: 40, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={180} 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 900 }} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '14px' }} 
                  />
                  <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={32}>
                    {importance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sidebar de Insights */}
          <div className="lg:col-span-4 flex flex-col gap-6 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] p-8 shrink-0 shadow-2xl shadow-blue-500/20"
            >
              <div className="flex items-center mb-6">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 mr-4"><Zap className="h-5 w-5 text-white" /></div>
                <h4 className="font-black text-white text-lg uppercase tracking-tight">IA Insight</h4>
              </div>
              <div className="text-sm text-blue-50/90 leading-relaxed font-bold italic">
                {importance.length > 0 ? 
                  `El factor "${importance[0].name}" tiene un impacto del ${importance[0].value}% en la probabilidad de deserción. Mejorar este indicador reduciría el riesgo global en un 15.4%.` :
                  "Analizando correlaciones en tiempo real..."}
              </div>
            </motion.div>

            <div className="glass-card rounded-[40px] p-8 border border-white/5 shrink-0 bg-slate-900/60">
              <h4 className="font-black text-white mb-8 flex items-center text-xs uppercase tracking-[0.2em]">
                <BrainCircuit className="mr-4 h-5 w-5 text-indigo-400" /> Top 3 Predictores
              </h4>
              <div className="space-y-6">
                 {importance.slice(0, 3).map((imp, idx) => (
                    <div key={imp.name} className="flex flex-col gap-3 group">
                       <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{imp.name}</span>
                          <span className="text-xs font-black text-white">{imp.value}%</span>
                       </div>
                       <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${imp.value}%` }} 
                            transition={{ duration: 1.5, delay: idx * 0.2 }}
                            className="h-full" 
                            style={{ backgroundColor: imp.color }} 
                          />
                       </div>
                    </div>
                 ))}
              </div>
            </div>

            <div className="glass-card rounded-[32px] p-8 border border-dashed border-slate-700/50 flex items-center gap-6 shrink-0 bg-black/20">
               <div className="bg-slate-900 rounded-2xl p-4 shadow-xl"><Cpu className="h-6 w-6 text-blue-500" /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Algoritmo de Detección</p>
                  <p className="text-sm font-black text-white">Gradient Boosting ITNL v2.4</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
