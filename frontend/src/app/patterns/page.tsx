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
  Calendar,
  GraduationCap,
  CheckSquare,
  Monitor,
  HeartHandshake,
  MapPin,
  Clock,
  ShieldAlert,
} from "lucide-react";
import ExplainerTrigger from "@/components/ExplainerTrigger";
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
    { name: "Asistencia Promedio", value: 84.5 },
    { name: "Promedio Académico", value: 78.2 },
    { name: "Entrega de Tareas", value: 62.8 },
    { name: "Arrastre de Materias (%)", value: 15.4 },
    { name: "Uso de Plataforma (Hrs)", value: 4.5 }
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
    const fetchData = async () => {
      setLoading(true);
      try {
        // Only send params that are actually set
        const params = new URLSearchParams();
        if (carrera) params.set("carrera", carrera);
        if (semestre) params.set("semestre", semestre);
        const query = params.toString() ? `?${params.toString()}` : "";
        const res = await axios.get(`${API_URL}/patterns${query}`);
        if (res.data && res.data.global) {
          setImportanceData(res.data);
        }
      } catch (e) { console.warn("Fallback active."); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [carrera, semestre]);

  const carreraLabel = carrera ? carrera.replace(/Ingenier.a/g, 'Ing.') : null;
  const semestreLabel = semestre ? `Semestre ${semestre}` : null;

  const slides = [
    { id: 'global', title: 'Patrones de Riesgo Institucional', icon: BrainCircuit, color: 'text-blue-500', bar: '#3b82f6' },
    { id: 'reprobacion', title: 'Indicadores de Reprobación', icon: AlertCircle, color: 'text-amber-500', bar: '#f59e0b' },
    { id: 'desercion', title: 'Factores de Deserción ITNL', icon: TrendingDown, color: 'text-red-500', bar: '#ef4444' }
  ];

  const currentSlide = slides[currentIndex];
  const chartData = importanceData[currentSlide.id] || FALLBACK_DATA[currentSlide.id as keyof typeof FALLBACK_DATA];

  const formatValue = (name: string, value: number, slideId: string) => {
    if (slideId === 'global') {
      return `${value}%`;
    }
    if (name.includes("Asistencia") || name.includes("Tareas") || name.includes("%") || name.includes("Tasa")) {
      return `${value}%`;
    }
    if (name.includes("Distancia")) {
      return `${value} km`;
    }
    if (name.includes("Trabajo") || name.includes("Plataforma")) {
      return `${value} hrs`;
    }
    if (name.includes("Promedio")) {
      return `${value}`;
    }
    return `${value}`;
  };

  const getMetricIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("asistencia")) return Calendar;
    if (n.includes("promedio")) return GraduationCap;
    if (n.includes("tarea") || n.includes("entrega")) return CheckSquare;
    if (n.includes("plataforma") || n.includes("digital")) return Monitor;
    if (n.includes("socioeconomico") || n.includes("económico")) return HeartHandshake;
    if (n.includes("distancia") || n.includes("traslado")) return MapPin;
    if (n.includes("trabajo") || n.includes("laboral")) return Clock;
    if (n.includes("deserción") || n.includes("deserto")) return TrendingDown;
    if (n.includes("reprobación") || n.includes("reprobo") || n.includes("arrastre")) return ShieldAlert;
    return Activity;
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6 bg-[#020617]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 shrink-0 mt-12 md:mt-0">
        <div className="flex items-center gap-4">
          <div className={`p-4 rounded-[24px] bg-white/5 ${currentSlide.color}`}>
            <currentSlide.icon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
              {currentSlide.title}
              <ExplainerTrigger id="patrones_ml" />
            </h2>
            <p className="text-xs font-black text-slate-300 uppercase tracking-widest italic">Análisis Basado en 5,000 Alumnos</p>
            {(carreraLabel || semestreLabel) && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {carreraLabel && <span className="text-xs font-black px-2 py-1 rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 uppercase">{carreraLabel}</span>}
                {semestreLabel && <span className="text-xs font-black px-2 py-1 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-400 uppercase">{semestreLabel}</span>}
              </div>
            )}
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

      <div className="flex-1 flex flex-col min-h-0 gap-6">
        <motion.div 
          key={`${currentIndex}-${carrera}-${semestre}`}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 glass-card rounded-[40px] p-4 md:p-10 flex flex-col min-h-[450px] bg-slate-900/40 border border-white/5 shadow-2xl overflow-hidden"
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
               <Activity className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <>
              <div className="h-[350px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 140, right: 20, top: 20, bottom: 20 }}>
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" tick={{fill: '#cbd5e1', fontSize: 13, fontWeight: '900'}} width={140} axisLine={false} tickLine={false} />
                    <Tooltip 
                       cursor={{fill: 'white', fillOpacity: 0.05}} 
                       contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px', fontSize: '12px'}}
                       itemStyle={{color: '#fff', fontWeight: '900'}}
                    />
                    <Bar dataKey="value" radius={[0, 16, 16, 0]} barSize={40}>
                      {chartData.map((_: any, i: number) => (
                        <Cell key={i} fill={currentSlide.bar} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </motion.div>

        {!loading && chartData && chartData.length > 0 && (
          <motion.div
            key={`summary-${currentIndex}-${carrera}-${semestre}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-[32px] p-6 md:p-8 bg-slate-900/30 border border-white/5 shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider italic">
                Resumen de Valores - {currentSlide.title}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {chartData.map((item: any, i: number) => {
                const IconComponent = getMetricIcon(item.name);
                return (
                  <div 
                    key={i} 
                    className="flex flex-col gap-1 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 hover:scale-[1.02] transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 text-slate-400">
                      <IconComponent className="h-4 w-4 shrink-0" style={{ color: currentSlide.bar }} />
                      <span className="text-[11px] font-black uppercase tracking-wider line-clamp-1">{item.name}</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-xl font-black text-white tracking-tight">
                        {formatValue(item.name, item.value, currentSlide.id)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800/60 h-1.5 rounded-full overflow-hidden mt-3">
                      <div 
                        className="h-full rounded-full transition-all duration-1000" 
                        style={{ 
                          width: `${Math.min(item.value, 100)}%`,
                          backgroundColor: currentSlide.bar
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
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
