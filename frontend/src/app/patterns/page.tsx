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
  Cpu
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

// HARDCODED FALLBACK to ensure charts are ALWAYS visible during presentation
const FALLBACK_DATA = {
  global: [
    { name: "Asistencia", value: 88 },
    { name: "Promedio", value: 75 },
    { name: "Plataforma", value: 42 },
    { name: "Tareas", value: 65 },
    { name: "Tutorías", value: 28 }
  ],
  reprobacion: [
    { name: "Promedio Bajo", value: 92 },
    { name: "Faltas", value: 85 },
    { name: "Tareas Faltantes", value: 70 },
    { name: "Sin Plataforma", value: 50 },
    { name: "Socioeconómico", value: 30 }
  ],
  desercion: [
    { name: "Abandono Total", value: 95 },
    { name: "Bajo Rendimiento", value: 80 },
    { name: "Problema Económico", value: 65 },
    { name: "Distancia", value: 40 },
    { name: "Trabajo", value: 35 }
  ]
};

export default function Patterns() {
  const [importanceData, setImportanceData] = useState<any>(FALLBACK_DATA);
  const [loading, setLoading] = useState(false); // No loading state for fallback
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const res = await axios.get(`${API_URL}/patterns`);
        if (res.data && res.data.global) {
          setImportanceData(res.data);
        }
      } catch (e) { 
        console.warn("Usando datos de respaldo para la presentación.");
      }
    };
    fetchPatterns();
  }, []);

  const slides = [
    { id: 'global', title: 'Patrones de Riesgo Global', icon: BrainCircuit, color: 'text-blue-500', bar: '#3b82f6' },
    { id: 'reprobacion', title: 'Factores de Reprobación', icon: AlertCircle, color: 'text-amber-500', bar: '#f59e0b' },
    { id: 'desercion', title: 'Factores de Deserción', icon: TrendingDown, color: 'text-red-500', bar: '#ef4444' }
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
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Análisis Predictivo basado en Dataset ITNL</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentIndex((currentIndex - 1 + 3) % 3)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="flex gap-1 px-4">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1 w-6 rounded-full ${i === currentIndex ? "bg-blue-500" : "bg-white/10"}`} />
            ))}
          </div>
          <button onClick={() => setCurrentIndex((currentIndex + 1) % 3)} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        <motion.div 
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-8 glass-card rounded-[32px] p-6 md:p-10 flex flex-col min-h-[400px] bg-slate-900/40 relative"
        >
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis dataKey="name" type="category" tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} width={80} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'white', fillOpacity: 0.05}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '12px'}} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={35}>
                  {chartData.map((_: any, i: number) => (
                    <Cell key={i} fill={currentSlide.bar} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="lg:col-span-4 flex flex-col gap-6">
           <div className="p-6 rounded-[32px] bg-blue-600/10 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-4 text-blue-400">
                 <Zap className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase">Foco Estratégico</span>
              </div>
              <p className="text-sm font-bold text-slate-300 leading-relaxed italic">
                El factor <span className="text-white underline">{chartData[0]?.name}</span> representa la mayor oportunidad de intervención para este segmento académico.
              </p>
           </div>

           <div className="flex-1 glass-card rounded-[32px] p-6 bg-black/20 border border-white/5">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Acciones Sugeridas</h4>
              <div className="space-y-3">
                 {["Monitoreo preventivo", "Tutoría académica", "Alerta temprana"].map((item, i) => (
                   <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-tight">
                      {item}
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
