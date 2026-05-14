"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
    { name: "Asistencia Total", value: 84.5 },
    { name: "Promedio General", value: 78.2 },
    { name: "Uso de Plataforma", value: 45.1 },
    { name: "Entrega de Tareas", value: 62.8 },
    { name: "Nivel Socioeconómico", value: 35.4 }
  ],
  reprobacion: [
    { name: "Materias Reprobadas Previas", value: 91.2 },
    { name: "Promedio Anterior", value: 85.5 },
    { name: "Inasistencias Clave", value: 72.4 },
    { name: "Baja Actividad Digital", value: 48.9 },
    { name: "Tareas Incompletas", value: 41.2 }
  ],
  desercion: [
    { name: "Inasistencia Crítica", value: 94.1 },
    { name: "Factor Económico", value: 82.3 },
    { name: "Distancia al Campus", value: 68.7 },
    { name: "Carga Laboral Externa", value: 55.4 },
    { name: "Bajo Rendimiento Global", value: 42.8 }
  ]
};

function PatternsContent() {
  const searchParams = useSearchParams();
  const [importanceData, setImportanceData] = useState<any>(FALLBACK_DATA);
  const [loading, setLoading] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const carrera = searchParams.get("carrera") || "";
  const semestre = searchParams.get("semestre") || "";

  useEffect(() => {
    const fetchPatterns = async () => {
      setLoading(true);
      try {
        const query = `?carrera=${encodeURIComponent(carrera)}&semestre=${semestre}`;
        const res = await axios.get(`${API_URL}/patterns${query}`);
        if (res.data && res.data.global) {
          setImportanceData(res.data);
        }
      } catch (e) { console.warn("Fallback active."); }
      finally { setLoading(false); }
    };
    fetchPatterns();
  }, [carrera, semestre]);

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
          key={`${currentIndex}-${carrera}-${semestre}`}
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
           <div className="p-8 rounded-[40px] bg-indigo-600/10 border border-indigo-500/20 backdrop-blur-md">
              <div className="flex items-center gap-3 mb-6 text-indigo-400">
                 <Activity className="h-5 w-5" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Hallazgos del Segmento</span>
              </div>
              <p className="text-sm font-bold text-slate-300 leading-snug mb-2 uppercase">Factor de Impacto:</p>
              <p className="text-2xl font-black text-white italic">Faltas Críticas</p>
              <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">
                El ausentismo representa el {importanceData.global?.[0]?.value || 84}% de la correlación con la reprobación en este grupo.
              </p>
           </div>

           <div className="flex-1 glass-card rounded-[40px] p-8 bg-black/30 border border-white/5 flex flex-col">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-8">Acciones Prioritarias</h4>
              <div className="space-y-4">
                 {[
                   { label: "Seguimiento Individual", desc: "Contactar alumnos con asistencia < 70%", icon: Zap },
                   { label: "Refuerzo Académico", desc: "Tutorías para materias con mayor reprobación", icon: BrainCircuit },
                   { label: "Apoyo Económico", desc: "Identificar candidatos para becas de retención", icon: Activity }
                 ].map((item, i) => (
                   <div key={i} className="group p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4 mb-2">
                         <item.icon className="h-4 w-4 text-blue-500" />
                         <span className="text-[11px] font-black text-white uppercase tracking-tight">{item.label}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight pl-8">{item.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function Patterns() {
  return (
    <Suspense fallback={<div className="h-full flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-blue-500" /></div>}>
       <PatternsContent />
    </Suspense>
  );
}
