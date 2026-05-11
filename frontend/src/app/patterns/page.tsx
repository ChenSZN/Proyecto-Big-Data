"use client";

import { useState, useEffect } from "react";
import { 
  Target, 
  Cpu, 
  Zap,
  CheckCircle2,
  Activity,
  AlertCircle
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { motion } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:8001/api";

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
    <div className="p-10 max-w-7xl mx-auto space-y-12">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Explicabilidad IA</p>
        <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">Patrones de <span className="text-blue-600 not-italic">Comportamiento</span></h1>
      </header>

      {loading ? (
        <div className="h-[400px] flex items-center justify-center">
           <Activity className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-red-500/20 rounded-[40px] bg-red-500/5">
           <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
           <p className="text-sm font-black uppercase text-red-400">Error al conectar con el servidor de análisis</p>
           <p className="text-[10px] text-slate-500 mt-2">Asegúrate de que el backend esté ejecutándose en el puerto 8000</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
          
          <div className="lg:col-span-8 glass-card rounded-[48px] p-12 border border-white/5 min-h-[550px] flex flex-col">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Drivers de Riesgo Académico</h3>
                <p className="text-xs font-bold text-slate-500 mt-1 uppercase">Importancia basada en Correlación Real</p>
              </div>
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            
            <div className="w-full flex-1 min-h-[350px]">
              {/* Usamos aspect para garantizar estabilidad en el tamaño del gráfico */}
              <ResponsiveContainer width="100%" aspect={1.8}>
                <BarChart data={importance} layout="vertical" margin={{ left: 20, right: 40 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={140} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 900 }} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '16px' }} />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={35}>
                    {importance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-blue-600/10 border border-blue-500/20 rounded-[40px] p-10">
              <div className="flex items-center mb-6">
                <div className="bg-blue-500 rounded-2xl p-3 mr-4 shadow-[0_0_20px_rgba(59,130,246,0.4)]"><Zap className="h-5 w-5 text-white" /></div>
                <h4 className="font-black text-white uppercase tracking-tight">Análisis Predictivo</h4>
              </div>
              <div className="text-sm text-blue-200/70 leading-relaxed font-medium italic">
                {importance.length > 0 ? 
                  `El factor "${importance[0].name}" es actualmente el predictor más fuerte con un ${importance[0].value}% de peso en la detección de riesgo.` :
                  "Cargando análisis de variables..."}
              </div>
            </motion.div>

            <div className="glass-card rounded-[40px] p-10 border border-white/5">
              <h4 className="font-black text-white mb-8 flex items-center text-xs uppercase tracking-widest">
                <CheckCircle2 className="mr-3 h-5 w-5 text-emerald-500" /> Indicadores Críticos
              </h4>
              <div className="space-y-6">
                 {importance.slice(0, 3).map(imp => (
                   <div key={imp.name} className="flex justify-between items-center group">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{imp.name}</span>
                      <span className="text-xs font-black text-blue-400 bg-blue-400/10 px-3 py-1 rounded-lg">PESO: {imp.value}%</span>
                   </div>
                 ))}
              </div>
            </div>

            <div className="glass-card rounded-[40px] p-8 border border-dashed border-slate-700/50 flex items-center gap-5">
               <div className="bg-slate-900 rounded-2xl p-4"><Cpu className="h-6 w-6 text-slate-500" /></div>
               <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Motor de Análisis</p>
                  <p className="text-sm font-black text-white">ITNL Patterns v1.0</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
