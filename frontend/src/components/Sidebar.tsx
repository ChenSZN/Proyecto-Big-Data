"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Database, 
  BrainCircuit, 
  ShieldCheck,
  ChevronRight
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
    <aside className="w-72 h-full flex flex-col bg-[#020617] border-r border-white/5 relative overflow-hidden">
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full" />
      
      <div className="p-8 relative z-10">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            <ShieldCheck className="text-white h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tighter leading-none uppercase italic">ITNL</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
        <p className="px-4 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Principal</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.path} href={item.path}>
              <div className={`
                relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                ${isActive 
                  ? "bg-blue-600/10 text-white" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]"
                }
              `}>
                {isActive && (
                  <motion.div 
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-6 bg-blue-500 rounded-full"
                  />
                )}
                
                <item.icon className={`h-5 w-5 transition-colors ${isActive ? "text-blue-500" : "group-hover:text-blue-400"}`} />
                <span className="text-sm font-bold tracking-tight">{item.name}</span>
                
                {isActive && <ChevronRight className="ml-auto h-4 w-4 text-blue-500/50" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-10 opacity-20 pointer-events-none">
         <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest text-center">Analítica ITNL v2.0</p>
      </div>
    </aside>
  );
}
