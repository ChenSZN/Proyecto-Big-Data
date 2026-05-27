"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  Globe,
  ChevronLeft,
  ChevronDown,
  Menu,
  Filter,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Explorador', icon: Database, path: '/drilldown' },
  { name: 'Patrones', icon: BrainCircuit, path: '/patterns' },
  { name: 'Entorno', icon: Globe, path: '/environment' },
];

const cleanText = (text: string) => {
  if (!text) return "";
  try { return decodeURIComponent(escape(text)); } catch (e) {
    return text.replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã\xad/g, 'í').replace(/Ã³/g, 'ó').replace(/Ãº/g, 'ú').replace(/Ã±/g, 'ñ');
  }
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [carreraOpen, setCarreraOpen] = useState(false);
  const [filters, setFilters] = useState<{ carreras: { value: string; label: string }[]; semestres: number[] }>({ carreras: [], semestres: [] });
  const carreraRef = useRef<HTMLDivElement>(null);

  const currentCarrera = searchParams.get("carrera") || "TODAS";
  const currentSemestre = searchParams.get("semestre") || "ALL";

  // Close carrera dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (carreraRef.current && !carreraRef.current.contains(e.target as Node)) {
        setCarreraOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch filter options from API
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await axios.get(`${API_URL}/drilldown/filters`);
        setFilters({
          carreras: (res.data.carreras || []).map((c: string) => ({
            value: c,
            label: cleanText(c),
          })),
          semestres: res.data.semestres || [],
        });
      } catch (e) { console.error("Error loading filters", e); }
    };
    fetchFilters();
  }, []);

  const updateGlobalFilter = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value === "TODAS" || value === "ALL" || value === "" || value === "0") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const showText = !isCollapsed || isMobileOpen;
  const currentLabel = currentCarrera === 'TODAS'
    ? 'Todas las Carreras'
    : (filters.carreras.find(c => c.value === currentCarrera)?.label || currentCarrera);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-6 left-6 z-[60] p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/80 z-[70] transition-opacity duration-150"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full z-[80]
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isCollapsed ? "w-20" : "w-72"}
        flex flex-col bg-[#020617] border-r border-white/5 overflow-hidden shrink-0
        transition-transform duration-150 ease-out will-change-transform
      `}>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute top-8 right-4 z-50 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-slate-400"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} space-y-1 relative z-10 overflow-y-auto custom-scrollbar mt-16`}>
          {showText && (
            <p className="px-4 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Navegación</p>
          )}

          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={`${item.path}?${searchParams.toString()}`} onClick={() => setIsMobileOpen(false)}>
                <div className={`
                  relative flex items-center ${!showText ? "justify-center" : "gap-3 px-4"} py-3 rounded-xl transition-all duration-200 group
                  ${isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                  }
                `}>
                  <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "group-hover:text-blue-400"}`} />
                  {showText && <span className="text-sm font-black tracking-tight uppercase">{item.name}</span>}
                </div>
              </Link>
            );
          })}

          {/* Global Filters */}
          {showText && (
            <div className="mt-10 space-y-6 px-2">
              <div className="pt-6 border-t border-white/5">
                <div className="flex items-center gap-2 mb-4 text-slate-400">
                  <Filter className="h-3 w-3" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Filtro Global</span>
                </div>

                <div className="space-y-4">

                  {/* ── Carrera custom dropdown ── */}
                  <div ref={carreraRef} className="relative">
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2 px-1">Carrera</label>
 
                    {/* Trigger button */}
                    <button
                      onClick={() => setCarreraOpen(o => !o)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-black text-left transition-all border ${
                        carreraOpen
                          ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                          : currentCarrera !== 'TODAS'
                            ? 'bg-blue-600/10 border-blue-500/20 text-blue-300'
                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/8 hover:border-white/10'
                      }`}
                    >
                      <span className="truncate pr-2">{currentLabel}</span>
                      <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${carreraOpen ? 'rotate-180 text-blue-400' : 'text-slate-600'}`} />
                    </button>

                    {/* Options panel */}
                    {carreraOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 z-[200] bg-[#0a1628] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/70">
                        <div className="max-h-52 overflow-y-auto custom-scrollbar py-1">
                          {/* All Carreras option */}
                          <button
                            onClick={() => { updateGlobalFilter('carrera', 'TODAS'); setCarreraOpen(false); }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${
                              currentCarrera === 'TODAS'
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-500 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            Todas las Carreras
                          </button>

                          {/* Divider */}
                          <div className="mx-4 my-1 border-t border-white/5" />

                          {filters.carreras.map(c => (
                            <button
                              key={c.value}
                              onClick={() => { updateGlobalFilter('carrera', c.value); setCarreraOpen(false); }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-colors ${
                                currentCarrera === c.value
                                  ? 'bg-blue-600 text-white'
                                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Semestre grid buttons ── */}
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block mb-2 px-1">Semestre</label>
                    <div className="grid grid-cols-4 gap-1">
                      <button
                        onClick={() => updateGlobalFilter("semestre", "ALL")}
                        className={`p-2 rounded-lg text-xs font-black transition-all ${currentSemestre === "ALL" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"}`}
                      >
                        ALL
                      </button>
                      {filters.semestres.map(s => (
                        <button
                          key={s}
                          onClick={() => updateGlobalFilter("semestre", s.toString())}
                          className={`p-2 rounded-lg text-xs font-black transition-all ${currentSemestre === s.toString() ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Footer: Live status */}
        {showText && (
          <div className="p-6 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-200 uppercase tracking-widest italic">Live en Render</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
