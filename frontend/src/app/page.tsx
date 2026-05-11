"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Users, TrendingUp, AlertTriangle, CheckCircle, 
  BarChart3, PieChart as PieIcon, Activity
} from "lucide-react";
import { motion } from "framer-motion";
import axios from "axios";
import { 
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';

const API_URL = "http://localhost:8001/api";
const COLORS = ['#ef4444', '#f59e0b', '#10b981'];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/stats`);
        setStats(res.data);
      } catch (e) { console.error(e); }
    };
    fetchStats();
  }, []);

  const chartData = useMemo(() => {
    if (!stats?.prioridad_dist) return [];
    return [
      { name: 'ALTO', value: stats.prioridad_dist['ALTO'] || 0, color: '#ef4444' },
      { name: 'MEDIO', value: stats.prioridad_dist['MEDIO'] || 0, color: '#f59e0b' },
      { name: 'BAJO', value: stats.prioridad_dist['BAJO'] || 0, color: '#10b981' },
    ];
  }, [stats]);

  if (!mounted) return null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic leading-tight">
            Dashboard <span className="text-blue-600 font-light not-italic tracking-normal">Analítico</span>
          </h1>
          <div className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs flex items-center gap-3">
             Sincronizado con Dataset ITNL • {new Date().toLocaleDateString()}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Alumnos" value={stats?.total_estudiantes || 0} icon={Users} color="text-blue-500" trend="Dataset Completo" />
        <StatCard title="Tasa Deserción" value={`${stats?.tasa_desercion || 0}%`} icon={TrendingUp} color="text-red-500" trend="Riesgo Detectado" />
        <StatCard title="Reprobación" value={`${stats?.tasa_reprobacion || 0}%`} icon={AlertTriangle} color="text-amber-500" trend="Índice Actual" />
        <StatCard title="Retención" value="92.4%" icon={CheckCircle} color="text-emerald-500" trend="Objetivo 2026" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 glass-card p-10 rounded-[48px] border border-white/5 min-h-[500px]">
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-10">Distribución de Riesgo</h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10}} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}} />
                <Bar dataKey="value" radius={[12, 12, 12, 12]} barSize={60}>
                  {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-10 rounded-[48px] border border-white/5 flex flex-col justify-between">
           <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Estatus de Riesgo</h3>
           <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                    {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '16px'}} />
                </PieChart>
              </ResponsiveContainer>
           </div>
           <div className="grid grid-cols-1 gap-4 mt-8">
              {chartData.map((d) => (
                <div key={d.name} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full" style={{backgroundColor: d.color}} />
                      <span className="text-[10px] font-black text-slate-500 uppercase">{d.name}</span>
                   </div>
                   <div className="text-xl font-black text-white">{d.value}</div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <div className="glass-card p-8 rounded-[40px] border border-white/5 relative overflow-hidden group">
      <div className="relative z-10">
        <div className={`p-4 rounded-2xl bg-white/5 w-fit mb-6 ${color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{title}</p>
        <h4 className="text-4xl font-black text-white tracking-tighter">{value}</h4>
        <p className="mt-4 text-[9px] font-bold text-slate-500 uppercase">{trend}</p>
      </div>
    </div>
  );
}
