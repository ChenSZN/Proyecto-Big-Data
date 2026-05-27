"use client";

import { useState, useEffect } from "react";
import { useExplainer } from "./ExplainerContext";
import { explainerRegistry } from "./ExplainerRegistry";
import { 
  X, Copy, Check, Terminal, BookOpen, 
  Code, Calculator, Sparkles, FileCode 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExplainerModal() {
  const { isOpen, activeId, closeExplainer } = useExplainer();
  const [activeTab, setActiveTab] = useState<"info" | "code">("info");
  const [codeLanguage, setCodeLanguage] = useState<"pandas" | "sql">("pandas");
  const [copied, setCopied] = useState(false);

  // Reset tab to info whenever modal is opened with a new item
  useEffect(() => {
    if (isOpen) {
      setActiveTab("info");
      setCodeLanguage("pandas");
    }
  }, [isOpen, activeId]);

  // Handle ESC key for closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeExplainer();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeExplainer]);

  if (!isOpen || !activeId) return null;

  const data = explainerRegistry[activeId];
  if (!data) return null;

  const handleCopy = () => {
    const textToCopy = codeLanguage === "pandas" ? data.pandasCode : data.sqlCode;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeExplainer}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/80 backdrop-blur-2xl flex flex-col max-h-[85vh] z-10"
        >
          {/* Header */}
          <header className="p-6 md:p-8 pb-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/5 to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-600/20 text-blue-400">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Explicador de Big Data</span>
                <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tight italic">{data.title}</h3>
              </div>
            </div>
            <button
              onClick={closeExplainer}
              className="p-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/15 transition-all"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Navigation Tabs */}
          <div className="px-6 md:px-8 py-3 border-b border-white/5 flex gap-4 shrink-0 bg-slate-950/20">
            <button
              onClick={() => setActiveTab("info")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "info"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Explicación
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                activeTab === "code"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              }`}
            >
              <Code className="h-4 w-4" />
              Código de Big Data
            </button>
          </div>

          {/* Body content */}
          <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar text-slate-300 text-sm leading-relaxed">
            {activeTab === "info" ? (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Concept */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 flex items-center gap-2">
                    <Sparkles className="h-3 w-3" /> Razonamiento y Concepto
                  </h4>
                  <p className="bg-white/[0.02] border border-white/5 p-5 rounded-2xl font-medium text-slate-300">
                    {data.concept}
                  </p>
                </div>

                {/* Formula */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
                    <Calculator className="h-3.5 w-3.5" /> Metodología Matemática / Lógica
                  </h4>
                  <div className="bg-indigo-600/5 border border-indigo-500/10 p-5 rounded-2xl flex items-center justify-center text-center font-black tracking-tight text-white font-mono text-xs md:text-sm">
                    {data.formula}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col h-full space-y-4"
              >
                {/* Language Switcher & Copy Header */}
                <div className="flex items-center justify-between shrink-0">
                  <div className="flex gap-2 p-1 bg-black/30 rounded-xl">
                    <button
                      onClick={() => setCodeLanguage("pandas")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        codeLanguage === "pandas"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Python (Pandas)
                    </button>
                    <button
                      onClick={() => setCodeLanguage("sql")}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                        codeLanguage === "sql"
                          ? "bg-blue-600 text-white"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      Standard SQL
                    </button>
                  </div>

                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      copied
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                        : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copiar Código
                      </>
                    )}
                  </button>
                </div>

                {/* Code Terminal View */}
                <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-slate-950 font-mono text-xs shadow-2xl flex-1 min-h-[220px]">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-white/5 text-slate-500 text-[10px] font-bold">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/30" />
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/30" />
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500/30" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Terminal className="h-3 w-3 text-slate-600" />
                      <span>{codeLanguage === "pandas" ? "pandas_analisis.py" : "query_db.sql"}</span>
                    </div>
                  </div>

                  {/* Terminal Code Body */}
                  <pre className="p-5 overflow-auto custom-scrollbar max-h-[300px] text-emerald-400 select-all leading-normal">
                    <code>{codeLanguage === "pandas" ? data.pandasCode : data.sqlCode}</code>
                  </pre>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <footer className="p-4 border-t border-white/5 bg-slate-950/20 text-center text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 shrink-0">
            Instituto Tecnológico de Nuevo Laredo • Big Data Analytics
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
