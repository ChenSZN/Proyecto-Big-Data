"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  Globe,
  ChevronLeft,
  Menu,
  Filter,
  GraduationCap,
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
  const [filters, setFilters] = useState<{carreras: string[], semestres: number[]}>({ carreras: [], semestres: [] });
  
  const currentCarrera = searchParams.get("carrera") || "TODAS";
  const currentSemestre = searchParams.get("semestre") || "ALL";

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await axios.get(`${API_URL}/drilldown/filters`);
        setFilters({
           carreras: (res.data.carreras || []).map((c: string) => cleanText(c)),
           semestres: res.data.semestres || []
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

  return (
    <>
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-6 left-6 z-[60] p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
      >
        <Menu className="h-6 w-6" />
      </button>

      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/80 z-[70] transition-opacity duration-150"
        />
      )}

      <aside className={`
        fixed md:relative top-0 left-0 h-full z-[80] 
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isCollapsed ? "w-20" : "w-72"}
        flex flex-col bg-[#020617] border-r border-white/5 overflow-hidden shrink-0
        transition-transform duration-150 ease-out will-change-transform
      `}>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute top-8 right-4 z-50 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-slate-400"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} space-y-1 relative z-10 overflow-y-auto custom-scrollbar mt-16`}>
          {showText && (
            <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4">Navegación</p>
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
                  {showText && <span className="text-xs font-black tracking-tight uppercase">{item.name}</span>}
                </div>
              </Link>
            );
          })}

          {showText && (
            <div className="mt-10 space-y-6 px-2">
               <div className="pt-6 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-4 text-slate-400">
                     <Filter className="h-3 w-3" />
                     <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Filtro Global</span>
                  </div>
                  
                  <div className="space-y-4">
                     <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-2">Carrera</label>
                        <select 
                          value={currentCarrera}
                          onChange={(e) => updateGlobalFilter("carrera", e.target.value)}
                          className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2.5 text-[10px] font-black text-slate-300 outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                        >
                           <option value="TODAS">TODAS LAS CARRERAS</option>
                           {filters.carreras.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>

                     <div>
                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-2">Semestre</label>
                        <div className="grid grid-cols-4 gap-1">
                           <button 
                             onClick={() => updateGlobalFilter("semestre", "ALL")}
                             className={`p-2 rounded-lg text-[9px] font-black transition-all ${currentSemestre === "ALL" ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
                           >
                              ALL
                           </button>
                           {filters.semestres.map(s => (
                              <button 
                                key={s}
                                onClick={() => updateGlobalFilter("semestre", s.toString())}
                                className={`p-2 rounded-lg text-[9px] font-black transition-all ${currentSemestre === s.toString() ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 hover:bg-white/10"}`}
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

        {showText && (
          <div className="p-6 border-t border-white/5">
             <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Live en Render</span>
             </div>
          </div>
        )}
      </aside>
    </>
  );
}
