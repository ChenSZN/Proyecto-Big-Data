"use client";

import { useState, useEffect } from "react";
import { 
  Target, 
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
  Cell,
  CartesianGrid
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

export default function Patterns() {
  const [importanceData, setImportanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const res = await axios.get(`${API_URL}/patterns`);
        setImportanceData(res.data);
      } catch (e) { 
        console.error("Error al cargar patrones:", e); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchPatterns();
  }, []);

  const slides = [
    { 
      id: 'global', 
      title: 'Patrones de Riesgo Global', 
      subtitle: 'Factores que más influyen en la prioridad de atención',
      icon: BrainCircuit,
      color: 'text-blue-500'
    },
    { 
      id: 'reprobacion', 
      title: 'Factores de Reprobación', 
      subtitle: 'Correlación directa con el fracaso en materias',
      icon: AlertCircle,
      color: 'text-amber-500'
    },
    { 
      id: 'desercion', 
      title: 'Factores de Deserción', 
      subtitle: 'Variables que anticipan el abandono escolar',
      icon: TrendingDown,
      color: 'text-red-500'
    }
  ];

  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
         <Activity className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  const currentSlide = slides[currentIndex];
  const chartData = importanceData?.[currentSlide.id] || [];

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      {/* Header Vacío para consistencia */}
      <header className="shrink-0 mb-4"></header>

      <div className="flex-1 min-h-0 relative flex flex-col gap-6">
        {/* Carousel Controls */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className={`p-4 rounded-[24px] bg-white/5 ${currentSlide.color}`}>
              <currentSlide.icon className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">{currentSlide.title}</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{currentSlide.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={prevSlide} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div className="flex gap-1 px-4">
              {slides.map((_, i) => (
                <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${i === currentIndex ? "bg-blue-500" : "bg-white/10"}`} />
              ))}
            </div>
            <button onClick={nextSlide} className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content Area with Animation */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentSlide.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="lg:col-span-8 glass-card rounded-[40px] p-8 flex flex-col min-h-[400px] bg-slate-900/40 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
                 <Cpu className="h-48 w-48" />
              </div>

              <div className="flex-1 min-h-[350px] w-full">
                {chartData && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 100, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" horizontal={false} />
                      <XAxis type="number" hide domain={[0, 100]} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'black'}}
                        width={120}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip 
                        cursor={{fill: 'white', fillOpacity: 0.05}}
                        contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}}
                      />
                      <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={32}>
                        {chartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={currentIndex === 2 ? '#ef4444' : currentIndex === 1 ? '#f59e0b' : '#3b82f6'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center opacity-40">
                     <div className="text-center">
                        <Activity className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-xs font-black uppercase tracking-widest">
                           {importanceData ? "No hay datos suficientes para este patrón" : "Sincronizando con el motor de IA..."}
                        </p>
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="lg:col-span-4 flex flex-col gap-4">
             <div className="p-6 rounded-[32px] bg-blue-600/10 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-4 text-blue-400">
                   <Zap className="h-5 w-5" />
                   <span className="text-xs font-black uppercase tracking-widest">Insight IA</span>
                </div>
                <p className="text-sm font-bold text-slate-300 leading-relaxed italic">
                  "El motor ha identificado que la <span className="text-white font-black underline">{chartData[0]?.name || 'métrica'}</span> es el indicador más fuerte para este segmento. Una intervención temprana en este rubro podría reducir el riesgo en un {(chartData[0]?.value * 0.15).toFixed(1)}%."
                </p>
             </div>

             <div className="flex-1 glass-card rounded-[32px] p-6 border border-white/5 flex flex-col gap-4 bg-black/20">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recomendaciones</h4>
                <div className="space-y-3">
                   {[
                     "Implementar tutorías focalizadas",
                     "Revisar acceso a plataforma digital",
                     "Sesiones de regularización",
                     "Monitoreo semanal de asistencia"
                   ].map((rec, i) => (
                     <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{rec}</span>
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
