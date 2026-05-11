"use client";

import { useState } from "react";
import { 
  AlertCircle,
  Activity,
  Cpu,
  BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_URL = "http://localhost:8000/api";

export default function Simulator() {
  const [form, setForm] = useState({
    v_p: 75, v_a: 85, v_u: 5, v_t: 70, v_r: 0
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/predict`, form);
      setResult(res.data);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <header className="mb-16 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <p className="text-xs font-black uppercase tracking-[0.4em] text-blue-500 mb-2">Motor de Inferencia IA</p>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase">Simulador <span className="text-blue-600">Pro</span></h1>
          <p className="mt-4 text-slate-500 font-medium max-w-xl mx-auto italic">Analiza patrones de comportamiento histórico para predecir la probabilidad de éxito o fallo académico.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Diagnostic Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 glass-card rounded-[40px] p-10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Cpu className="h-32 w-32" />
          </div>
          
          <h3 className="mb-12 flex items-center text-xl font-black text-white uppercase tracking-tight">
            <Activity className="mr-4 h-6 w-6 text-blue-500" />
            Parámetros de Diagnóstico
          </h3>
          
          <div className="space-y-12">
            <Slider 
              label="Promedio Institucional" value={form.v_p} min={0} max={100} unit="pts"
              onChange={(v: number) => setForm({...form, v_p: v})} 
              color="bg-blue-500"
            />
            <Slider 
              label="Asistencia Semanal" value={form.v_a} min={0} max={100} unit="%"
              onChange={(v: number) => setForm({...form, v_a: v})} 
              color="bg-indigo-500"
            />
            <div className="grid grid-cols-2 gap-8">
               <Slider 
                 label="Plataforma (hrs)" value={form.v_u} min={0} max={20} unit="h"
                 onChange={(v: number) => setForm({...form, v_u: v})} 
                 color="bg-emerald-500"
               />
               <Slider 
                 label="Entregas (%)" value={form.v_t} min={0} max={100} unit="%"
                 onChange={(v: number) => setForm({...form, v_t: v})} 
                 color="bg-purple-500"
               />
            </div>
            
            <div>
              <label className="mb-4 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Materias Reprobadas Previas</label>
              <div className="flex items-center gap-4">
                <input 
                  type="number" value={form.v_r}
                  onChange={(e) => setForm({...form, v_r: parseInt(e.target.value) || 0})}
                  className="w-24 rounded-2xl border border-white/5 bg-white/5 p-4 text-center text-xl font-black text-white outline-none focus:border-blue-500 focus:bg-blue-500/10 transition-all"
                />
                <p className="text-xs font-bold text-slate-600">Este factor incrementa el peso del riesgo exponencialmente.</p>
              </div>
            </div>

            <button 
              onClick={handlePredict} disabled={loading}
              className="btn-primary w-full text-lg uppercase tracking-widest py-5 group"
            >
              <div className="flex items-center justify-center gap-3">
                {loading ? "Sincronizando Neuronas..." : "Generar Diagnóstico Predictivo"}
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Diagnostic Display */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`glass-card rounded-[40px] p-10 text-center relative overflow-hidden border-2 ${
                  result.prioridad === 'CRÍTICO' ? 'border-red-500/30' : 
                  result.prioridad === 'ALTO' ? 'border-amber-500/30' : 'border-emerald-500/30'
                }`}
              >
                <div className={`absolute top-0 inset-x-0 h-1 ${
                  result.prioridad === 'CRÍTICO' ? 'bg-red-500' : 
                  result.prioridad === 'ALTO' ? 'bg-amber-500' : 'bg-emerald-500'
                } shadow-[0_0_20px_rgba(0,0,0,1)]`} />
                
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">Probabilidad de Fallo</p>
                
                <div className="relative inline-block mb-8">
                   <svg className="h-48 w-48 -rotate-90">
                      <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
                      <circle 
                        cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                        strokeDasharray={552} strokeDashoffset={552 - (552 * result.probabilidad) / 100}
                        className={`${result.prioridad === 'CRÍTICO' ? 'text-red-500' : result.prioridad === 'ALTO' ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-white tracking-tighter">{result.probabilidad.toFixed(0)}%</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Score IA</span>
                   </div>
                </div>

                <h2 className={`text-2xl font-black uppercase tracking-tighter mb-4 ${
                  result.prioridad === 'CRÍTICO' ? 'text-red-500' : result.prioridad === 'ALTO' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {result.prioridad}
                </h2>
                
                <p className="text-sm font-medium text-slate-400 leading-relaxed px-4 italic">
                  "{result.recomendacion}"
                </p>
              </motion.div>
            ) : (
              <div className="glass-card flex h-full items-center justify-center rounded-[40px] p-12 text-center border-dashed">
                <div className="opacity-20 flex flex-col items-center gap-6">
                  <BarChart2 className="h-20 w-20 text-blue-500" />
                  <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Esperando Señal Académica</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          <div className="glass-card rounded-[32px] p-8 text-white">
            <h4 className="mb-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Checkpoint de Variables</h4>
            <div className="space-y-4">
              <RiskFactor label="Asistencia Crítica (<75%)" active={form.v_a < 75} />
              <RiskFactor label="Inactividad en Plataforma" active={form.v_u < 3} />
              <RiskFactor label="Rezago de Entregas" active={form.v_t < 60} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, onChange, unit, color }: any) {
  return (
    <div className="group">
      <div className="mb-4 flex justify-between items-end">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-white transition-colors">{label}</span>
        <span className={`text-xl font-black tracking-tighter ${color.replace('bg-', 'text-')}`}>{value} <span className="text-xs text-slate-500 font-bold ml-1">{unit}</span></span>
      </div>
      <input 
        type="range" min={min} max={max} value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className={`h-2 w-full cursor-pointer appearance-none rounded-full bg-white/5 accent-blue-500 transition-all hover:bg-white/10`}
      />
    </div>
  );
}

function RiskFactor({ label, active }: { label: string, active: boolean }) {
  return (
    <div className={`flex items-center gap-4 rounded-2xl p-3 transition-all ${active ? 'bg-red-500/5 border border-red-500/20 text-red-400' : 'opacity-30 grayscale text-slate-500'}`}>
      <div className={`h-2 w-2 rounded-full ${active ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : 'bg-slate-500'}`} />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
      {active && <AlertCircle className="ml-auto h-4 w-4" />}
    </div>
  );
}

const ArrowRight = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
);
