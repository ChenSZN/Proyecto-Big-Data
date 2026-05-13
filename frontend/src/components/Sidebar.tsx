"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  ShieldCheck,
  ChevronRight,
  LogOut,
  HelpCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Drill-Down', icon: Database, path: '/drilldown' },
  { name: 'Patrones ML', icon: BrainCircuit, path: '/patterns' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 h-full flex flex-col bg-[#020617] border-r border-white/5 relative overflow-hidden shrink-0">
      {/* Glow ambiental superior */}
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
      
      {/* Branding */}
      {/* Navegación */}
      <nav className="flex-1 px-6 py-10 space-y-3 relative z-10">
        <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-8">Menú Principal</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`
                relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group
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
                <span className="text-sm font-black tracking-tight uppercase">{item.name}</span>
                
                {isActive && <ChevronRight className="ml-auto h-4 w-4 text-blue-500" />}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
