"use client";

import React, { createContext, useContext, useState } from "react";
import ExplainerModal from "./ExplainerModal";

interface ExplainerContextType {
  isOpen: boolean;
  activeId: string | null;
  openExplainer: (id: string) => void;
  closeExplainer: () => void;
}

const ExplainerContext = createContext<ExplainerContextType | undefined>(undefined);

export function ExplainerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const openExplainer = (id: string) => {
    setActiveId(id);
    setIsOpen(true);
  };

  const closeExplainer = () => {
    setIsOpen(false);
    // Delay resetting activeId to avoid flicker during close transitions
    setTimeout(() => {
      setActiveId(null);
    }, 300);
  };

  return (
    <ExplainerContext.Provider value={{ isOpen, activeId, openExplainer, closeExplainer }}>
      {children}
      <ExplainerModal />
    </ExplainerContext.Provider>
  );
}

export function useExplainer() {
  const context = useContext(ExplainerContext);
  if (context === undefined) {
    throw new Error("useExplainer must be used within an ExplainerProvider");
  }
  return context;
}
