"use client";

import { useExplainer } from "./ExplainerContext";
import { Code } from "lucide-react";

interface ExplainerTriggerProps {
  id: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function ExplainerTrigger({ id, className = "", size = "sm" }: ExplainerTriggerProps) {
  const { openExplainer } = useExplainer();

  const sizeClasses = {
    sm: "p-1.5 rounded-lg text-[10px]",
    md: "p-2 rounded-xl text-[12px]",
    lg: "p-2.5 rounded-2xl text-[14px]",
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation(); // Avoid triggering card clicks
        openExplainer(id);
      }}
      title="Explicación y Código de Big Data"
      className={`inline-flex items-center justify-center bg-white/5 hover:bg-blue-600/20 text-slate-400 hover:text-blue-400 border border-white/5 hover:border-blue-500/20 transition-all duration-200 cursor-pointer active:scale-95 ${sizeClasses[size]} ${className}`}
    >
      <Code className={iconSizes[size]} />
    </button>
  );
}
