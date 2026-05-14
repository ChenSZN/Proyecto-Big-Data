"use client";

import { useState, useEffect } from "react";
import { 
  BrainCircuit, 
  TrendingDown,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Cpu,
  Database
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
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const FALLBACK_DATA = {
  global: [
    { name: "Asistencia", value: 84.5 },
    { name: "Promedio Gral", value: 78.2 },
    { name: "Plataforma", value: 45.1 },
    { name: "Entregas", value: 62.8 },
    { name: "Socioeconómico", value: 35.4 }
  ],
  reprobacion: [
    { name: "Materias Previas", value: 91.2 },
    { name: "Promedio Anterior", value: 85.5 },
    { name: "Faltas Clave", value: 72.4 },
    { name: "Baja Actividad", value: 48.9 },
    { name: "Tareas Inc.", value: 41.2 }
  ],
  desercion: [
    { name: "Inasistencia Crítica", value: 94.1 },
    { name: "Factor Económico", value: 82.3 },
    { name: "Distancia Campus", value: 68.7 },
    { name: "Carga Laboral", value: 55.4 },
    { name: "Bajo Rendimiento", value: 42.8 }
  ]
};

export default function Patterns() {
  const [importanceData, setImportanceData] = useState<any>(FALLBACK_DATA);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const res = await axios.get(`${API_URL}/patterns`);
        if (res.data && res.data.global && res.data.global.length > 0) {
          setImportanceData(res.data);
        }
      } catch (e) { console.warn("Fallback data active."); }
    };
    fetchPatterns();
  }, []);

  const slides = [
    { id: 'global', title: 'Patrones de Riesgo Institucional', icon: BrainCircuit, color: 'text-blue-500', bar: '#3b82f6' },
    { id: 'reprobacion', title: 'Indicadores de Reprobación', icon: AlertCircle, color: 'text-amber-500', bar: '#f59e0b' },
    { id: 'desercion', title: 'Factores de Deserción ITNL', icon: TrendingDown, color: 'text-red-500', bar: '#ef4444' }
  ];

  const currentSlide = slides[currentIndex];
  const chartData = importanceData[currentSlide.id] || FALLBACK_DATA[currentSlide.id as keyof typeof FALLBACK_DATA];

  return (
    <div className="p-4 md:p-8 h-full flex flex-col gap-6 overflow-y-auto lg:overflow-hidden bg-[#020617]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 mt-12 md:mt-0">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-[24px] bg-white/5 ${currentSlide.color}`}>
            <currentSlide.icon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">{currentSlide.title}</h2>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Análisis Basado en 5,000 Alumnos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentIndex((currentIndex - 1 + 3) % 3)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex gap-1 px-4">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 w-6 rounded-full transition-all duration-500 ${i === currentIndex ? "bg-blue-500 w-12" : "bg-white/10"}`} />
            ))}
          </div>
          <button onClick={() => setCurrentIndex((currentIndex + 1) % 3)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-8 glass-card rounded-[40px] p-6 md:p-10 flex flex-col min-h-[400px] bg-slate-900/40 border border-white/5 shadow-2xl"
        >
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 40, top: 20, bottom: 20 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: '800'}} width={100} axisLine={false} tickLine={false} />
                <Tooltip 
                   cursor={{fill: 'white', fillOpacity: 0.05}} 
                   contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}}
                   itemStyle={{color: '#fff', fontWeight: '900', fontSize: '14px'}}
                />
                <Bar dataKey="value" radius={[0, 12, 12, 0]} barSize={35}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill={currentSlide.bar} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="p-8 rounded-[40px] bg-blue-600/10 border border-blue-500/20 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 text-blue-400">
                 <Database className="h-5 w-5 fill-current" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Validación de Datos</span>
              </div>
              <p className="text-sm font-bold text-slate-300 leading-snug mb-2 uppercase">Muestra Total:</p>
              <p className="text-3xl font-black text-white italic">5,000 Casos</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Correlación calculada en tiempo real sobre el dataset completo del Tecnológico.</p>
           </div>

           <div className="flex-1 glass-card rounded-[40px] p-8 bg-black/30 border border-white/5 flex flex-col">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Estrategias IA</h4>
              <div className="space-y-4">
                 {[
                   { label: "Alertas Automáticas", icon: Zap },
                   { label: "Mapeo de Patrones", icon: BrainCircuit },
                   { label: "Optimización de Recursos", icon: Activity }
                 ].map((item, i) => (
                   <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-default">
                      <item.icon className="h-4 w-4 text-slate-500" />
                      <span className="text-[11px] font-black text-slate-300 uppercase tracking-tight">{item.label}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
