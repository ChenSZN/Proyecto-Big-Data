"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  ChevronRight,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Drill-Down', icon: Database, path: '/drilldown' },
  { name: 'Patrones ML', icon: BrainCircuit, path: '/patterns' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${isCollapsed ? "w-24" : "w-72"} h-full flex flex-col bg-[#020617] border-r border-white/5 relative overflow-hidden shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]`}>
      {/* Glow ambiental superior */}
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
      
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-8 right-6 z-50 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-slate-400 hover:text-white"
      >
        {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
      </button>

      {/* Navegación */}
      <nav className={`flex-1 ${isCollapsed ? "px-3" : "px-6"} py-10 mt-16 space-y-3 relative z-10`}>
        {!isCollapsed && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-8"
          >
            Menú Principal
          </motion.p>
        )}
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`
                relative flex items-center ${isCollapsed ? "justify-center" : "gap-4 px-5"} py-4 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? "bg-blue-600/10 text-white shadow-[inset_0_0_20px_rgba(59,130,246,0.05)] border border-blue-500/20" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                }
              `}>
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-blue-500" : "group-hover:text-blue-400"}`} />
                
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="text-sm font-black tracking-tight uppercase whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {!isCollapsed && isActive && <ChevronRight className="ml-auto h-4 w-4 text-blue-500" />}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
