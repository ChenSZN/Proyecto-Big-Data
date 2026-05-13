"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  Globe,
  ChevronRight,
  ChevronLeft,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Drill-Down', icon: Database, path: '/drilldown' },
  { name: 'PATRONES', icon: BrainCircuit, path: '/patterns' },
  { name: 'ENTORNO', icon: Globe, path: '/environment' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Toggle - Snappier transition */}
      <button 
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-6 left-6 z-[60] p-3 rounded-2xl bg-blue-600 text-white shadow-lg active:scale-95 transition-transform"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Overlay - Static background to avoid lag */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-[2px] z-[70] transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container - Optimized transitions */}
      <aside className={`
        fixed md:relative top-0 left-0 h-full z-[80] 
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        ${isCollapsed ? "w-20" : "w-64"}
        flex flex-col bg-[#020617] border-r border-white/5 overflow-hidden shrink-0
        transition-all duration-300 ease-out will-change-transform
      `}>
        {/* Glow ambiental superior */}
        <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-600/5 blur-[80px] rounded-full pointer-events-none" />
        
        {/* Desktop Collapse Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute top-8 right-4 z-50 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-slate-400"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden absolute top-8 right-6 z-50 p-2 rounded-xl bg-white/5 text-slate-400"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navegación */}
        <nav className={`flex-1 ${isCollapsed ? "px-2" : "px-4"} py-10 mt-16 space-y-2 relative z-10`}>
          {(!isCollapsed || isMobileOpen) && (
            <p className="px-4 text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Principal</p>
          )}
          
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            const showText = !isCollapsed || isMobileOpen;

            return (
              <Link key={item.path} href={item.path} onClick={() => setIsMobileOpen(false)}>
                <div className={`
                  relative flex items-center ${!showText ? "justify-center" : "gap-3 px-4"} py-3.5 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                  }
                `}>
                  <item.icon className={`h-5 w-5 ${isActive ? "text-white" : "group-hover:text-blue-400"}`} />
                  
                  {showText && (
                    <span className="text-xs font-black tracking-tight uppercase whitespace-nowrap">
                      {item.name}
                    </span>
                  )}
                  
                  {showText && isActive && <ChevronRight className="ml-auto h-3 w-3 text-white/50" />}
                </div>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
