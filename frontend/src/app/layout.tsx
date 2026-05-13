import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Sidebar from "@/components/Sidebar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: "SAT ITNL | Intelligent Analytics",
  description: "Plataforma de Inteligencia Predictiva - Tecnológico de Nuevo Laredo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={`${jakarta.className} bg-[#020617] text-slate-200 antialiased selection:bg-blue-500/30 overflow-x-hidden`}>
        {/* Capa de Gradiente Ambiental */}
        <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-[10%] -left-[10%] h-[40%] w-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
          <div className="absolute top-[20%] -right-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[150px]" />
          <div className="absolute -bottom-[10%] left-[20%] h-[40%] w-[40%] rounded-full bg-purple-600/5 blur-[120px]" />
        </div>

        {/* Contenedor Principal Flexible */}
        <div className="flex flex-col md:flex-row min-h-screen md:h-screen w-full p-2 md:p-6 gap-2 md:gap-6 overflow-hidden">
          <Sidebar />
          <main className="flex-1 glass-card rounded-[24px] md:rounded-[48px] overflow-hidden relative flex flex-col border border-white/5 bg-slate-900/20 backdrop-blur-3xl shadow-2xl mt-16 md:mt-0">
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
