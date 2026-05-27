"use client";

import { useState } from "react";
import { 
  AlertCircle,
  Activity,
  Cpu,
  BarChart2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ExplainerTrigger from "@/components/ExplainerTrigger";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

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
    <div className="p-8 h-full flex flex-col gap-6 overflow-hidden">
      <header className="shrink-0 mb-4">
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 flex-1 min-h-0 overflow-y-auto pr-2 custom-scrollbar">
        {/* Diagnostic Controls */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 glass-card rounded-[40px] p-8 relative overflow-hidden h-fit"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
             <Cpu className="h-24 w-24" />
          </div>
          
          <h3 className="mb-8 flex items-center justify-between text-lg font-black text-white uppercase tracking-tight">
            <div className="flex items-center">
              <Activity className="mr-3 h-5 w-5 text-blue-500" />
              Parámetros
            </div>
            <ExplainerTrigger id="predict_simulador" />
          </h3>
          
          <div className="space-y-8">
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
            <div className="grid grid-cols-2 gap-6">
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
            
            <div className="flex items-center justify-between">
              <div>
                <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Materias Reprobadas</label>
                <input 
                  type="number" value={form.v_r}
                  onChange={(e) => setForm({...form, v_r: parseInt(e.target.value) || 0})}
                  className="w-20 rounded-xl border border-white/5 bg-white/5 p-3 text-center text-lg font-black text-white outline-none focus:border-blue-500 focus:bg-blue-500/10 transition-all"
                />
              </div>
              <button 
                onClick={handlePredict} disabled={loading}
                className="btn-primary flex-1 ml-6 text-sm uppercase tracking-widest py-4 group"
              >
                <div className="flex items-center justify-center gap-3">
                  {loading ? "Calculando..." : "Diagnóstico"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Diagnostic Display */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className={`glass-card rounded-[40px] p-8 text-center relative overflow-hidden border-2 ${
                  result.prioridad === 'CRÍTICO' ? 'border-red-500/30' : 
                  result.prioridad === 'ALTO' ? 'border-amber-500/30' : 'border-emerald-500/30'
                }`}
              >
                <div className={`absolute top-0 inset-x-0 h-1 ${
                  result.prioridad === 'CRÍTICO' ? 'bg-red-500' : 
                  result.prioridad === 'ALTO' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />
                
                <div className="flex items-center justify-center gap-2 mb-2">
                   <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500">Fallo Probable</p>
                   <ExplainerTrigger id="predict_simulador" />
                </div>
                
                <div className="relative inline-block mb-6">
                   <svg className="h-40 w-40 -rotate-90">
                      <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/5" />
                      <circle 
                        cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="10" fill="transparent" 
                        strokeDasharray={452} strokeDashoffset={452 - (452 * result.probabilidad) / 100}
                        className={`${result.prioridad === 'CRÍTICO' ? 'text-red-500' : result.prioridad === 'ALTO' ? 'text-amber-500' : 'text-emerald-500'} transition-all duration-1000 ease-out`}
                        strokeLinecap="round"
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black text-white tracking-tighter">{result.probabilidad.toFixed(0)}%</span>
                   </div>
                </div>

                <h2 className={`text-xl font-black uppercase tracking-tighter mb-2 ${
                  result.prioridad === 'CRÍTICO' ? 'text-red-500' : result.prioridad === 'ALTO' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {result.prioridad}
                </h2>
                
                <p className="text-xs font-medium text-slate-400 leading-relaxed italic line-clamp-3">
                  "{result.recomendacion}"
                </p>
              </motion.div>
            ) : (
              <div className="glass-card flex min-h-[300px] items-center justify-center rounded-[40px] p-8 text-center border-dashed">
                <div className="opacity-20 flex flex-col items-center gap-4">
                  <BarChart2 className="h-16 w-16 text-blue-500" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sin Datos</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          <div className="glass-card rounded-[32px] p-6 text-white h-fit">
            <h4 className="mb-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-600">Checkpoint</h4>
            <div className="space-y-3">
              <RiskFactor label="Baja Asistencia" active={form.v_a < 75} />
              <RiskFactor label="Inactividad" active={form.v_u < 3} />
              <RiskFactor label="Rezago" active={form.v_t < 60} />
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
