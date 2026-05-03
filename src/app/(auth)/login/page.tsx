"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { LoginForm } from "./components";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import type { LoginFormData, LoginResponse } from "./types";
import type { PortalType } from "@/types/auth";
import { FaWhatsapp } from "react-icons/fa";
import {
  Building2,
  Baby,
  ShieldCheck,
  Activity,
  Users,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ADMIN_WHATSAPP = "+61421705876";

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<PortalType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync body background with selected portal for overscroll aesthetic
  React.useEffect(() => {
    if (selectedPortal === "infertility") {
      document.body.style.backgroundColor = "#022c22"; // Deep Emerald
    } else if (selectedPortal === "general") {
      document.body.style.backgroundColor = "#020617"; // Deep Slate
    } else {
      document.body.style.backgroundColor = "#020617";
    }
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, [selectedPortal]);

  const handleLogin = useCallback(
    async (formData: LoginFormData) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetchWithCSRF("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error ||
              errorData.message ||
              "Login failed. Please try again.",
          );
        }

        const data: LoginResponse = await response.json();

        if (!data.success || !data.user) {
          throw new Error(data.error || "Login failed. Please try again.");
        }

        await login(data.user);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "An unexpected error occurred. Please try again.";
        setError(errorMessage);
        console.error("Login error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [login],
  );

  const openWhatsApp = () => {
    const number = ADMIN_WHATSAPP.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${number}`, "_blank");
  };

  const handlePortalClick = (portal: PortalType) => {
    if (selectedPortal !== portal) {
      setSelectedPortal(portal);
      setError(null);
    }
  };

  // Shared transition settings for all portal elements
  const springTransition = {
    type: "spring" as const,
    stiffness: 260,
    damping: 30,
    mass: 1,
  };

  return (
    <LayoutGroup>
      <div className="w-full flex items-center justify-center p-0 sm:p-4 lg:p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-[1280px] bg-slate-950 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col lg:flex-row relative min-h-[700px] lg:h-[820px] border border-white/5">
          {/* ═══════════════ LEFT PANEL: GENERAL HOSPITAL ═══════════════ */}
          <motion.div
            layout
            transition={springTransition}
            onClick={() => handlePortalClick("general")}
            whileHover={!selectedPortal ? { scale: 1.005 } : {}}
            className={cn(
              "relative flex flex-col transition-opacity duration-700 ease-out cursor-pointer group overflow-hidden",
              selectedPortal === "general"
                ? "h-full lg:w-full z-20 cursor-default"
                : selectedPortal === "infertility"
                  ? "h-[80px] lg:h-full lg:w-[12%] opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
                  : "flex-1 h-1/2 lg:h-full lg:w-1/2",
            )}
          >
            {/* Background & Lighting Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] z-0" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tr from-blue-500 via-transparent to-transparent z-0" />

            <div className="relative z-10 flex flex-col h-full p-6 lg:p-14">
              {/* Header */}
              <motion.div
                layout
                transition={springTransition}
                className={cn(
                  "flex items-center gap-4",
                  selectedPortal === "infertility"
                    ? "justify-center lg:mt-8"
                    : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-2xl",
                    selectedPortal === "general"
                      ? "bg-blue-600 text-white border-blue-400"
                      : "bg-blue-500/10 backdrop-blur-xl border-blue-500/20 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20",
                  )}
                >
                  <Building2 className="w-6 h-6 lg:w-7 lg:h-7" />
                </div>
                {selectedPortal !== "infertility" && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight uppercase">
                      FNH <span className="text-blue-500">Connect</span>
                    </h1>
                    <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.3em]">
                      Hospital Management
                    </p>
                  </motion.div>
                )}
              </motion.div>

              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {selectedPortal === "general" ? (
                    <motion.div
                      key="general-active"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-md mx-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedPortal(null)}
                        className="group/back mb-10 flex items-center gap-2 text-white/50 hover:text-white transition-all font-bold text-[10px] uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-white/20"
                      >
                        <ArrowLeft className="w-3 h-3 group-hover/back:-translate-x-1 transition-transform" />{" "}
                        Back to Portals
                      </button>
                      <div className="mb-10">
                        <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
                          Primary <br />
                          Access.
                        </h2>
                        <p className="text-blue-200/60 text-sm font-medium leading-relaxed">
                          Enter your credentials to manage admissions, pathology
                          and hospital resources.
                        </p>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/form">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-transparent opacity-50" />
                        <LoginForm
                          onSubmit={handleLogin}
                          isLoading={isLoading}
                          error={error}
                          portal="general"
                        />
                      </div>
                    </motion.div>
                  ) : selectedPortal === "infertility" ? null : (
                    <motion.div
                      key="general-intro"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                    >
                      <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                          <Sparkles className="w-3 h-3" /> System Primary
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] mb-8 tracking-tighter">
                          Everything <br />
                          <span className="text-blue-600">Unified.</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                          Admissions, Pathology, and Resource management in one
                          high-performance interface.
                        </p>
                      </div>

                      <div className="hidden lg:flex gap-4">
                        {[Activity, Users, ShieldCheck].map((Icon, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-3xl bg-white/5 border border-white/5 group-hover:border-blue-500/30 transition-all duration-500 group-hover:bg-blue-500/10 group-hover:scale-110"
                          >
                            <Icon className="w-5 h-5 text-blue-500" />
                          </div>
                        ))}
                      </div>

                      <div className="lg:hidden flex items-center gap-2 text-blue-500 font-bold text-sm uppercase tracking-widest animate-pulse">
                        Tap to Enter <ArrowRight className="w-4 h-4" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Hover Decor */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[120px] -mr-32 -mb-32 group-hover:bg-blue-600/30 group-hover:scale-150 transition-all duration-1000" />
          </motion.div>

          {/* ═══════════════ RIGHT PANEL: INFERTILITY ═══════════════ */}
          <motion.div
            layout
            transition={springTransition}
            onClick={() => handlePortalClick("infertility")}
            whileHover={!selectedPortal ? { scale: 1.005 } : {}}
            className={cn(
              "relative flex flex-col transition-opacity duration-700 ease-out cursor-pointer group overflow-hidden",
              selectedPortal === "infertility"
                ? "h-full lg:w-full z-20 cursor-default"
                : selectedPortal === "general"
                  ? "h-[80px] lg:h-full lg:w-[12%] opacity-40 grayscale hover:grayscale-0 hover:opacity-100"
                  : "flex-1 h-1/2 lg:h-full lg:w-1/2",
            )}
          >
            {/* Background & Lighting Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#064e3b] to-[#022c22] z-0" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tl from-emerald-500 via-transparent to-transparent z-0" />

            <div className="relative z-10 flex flex-col h-full p-6 lg:p-14">
              {/* Header */}
              <motion.div
                layout
                transition={springTransition}
                className={cn(
                  "flex items-center gap-4",
                  selectedPortal === "general"
                    ? "justify-center lg:mt-8"
                    : "justify-start lg:justify-end lg:flex-row-reverse",
                )}
              >
                <div
                  className={cn(
                    "shrink-0 w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center border transition-all duration-500 shadow-2xl",
                    selectedPortal === "infertility"
                      ? "bg-emerald-600 text-white border-emerald-400"
                      : "bg-emerald-500/10 backdrop-blur-xl border-emerald-500/20 text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/20",
                  )}
                >
                  <Baby className="w-6 h-6 lg:w-7 lg:h-7" />
                </div>
                {selectedPortal !== "general" && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="text-right"
                  >
                    <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight uppercase">
                      FNH <span className="text-emerald-500">Infertility</span>
                    </h1>
                    <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-[0.3em]">
                      Fertility Care Portal
                    </p>
                  </motion.div>
                )}
              </motion.div>

              <div className="flex-1 flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  {selectedPortal === "infertility" ? (
                    <motion.div
                      key="infertility-active"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="w-full max-w-md mx-auto"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedPortal(null)}
                        className="group/back mb-10 flex items-center gap-2 text-white/50 hover:text-white transition-all font-bold text-[10px] uppercase tracking-[0.3em] bg-white/5 px-4 py-2 rounded-full border border-white/5 hover:border-white/20"
                      >
                        <ArrowLeft className="w-3 h-3 group-hover/back:-translate-x-1 transition-transform" />{" "}
                        Back to Portals
                      </button>
                      <div className="mb-10 lg:text-left text-right">
                        <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
                          Specialized <br />
                          Unit.
                        </h2>
                        <p className="text-emerald-200/60 text-sm font-medium leading-relaxed">
                          Dedicated system for patient management,
                          investigations and financial auditing.
                        </p>
                      </div>
                      <div className="bg-slate-900/80 backdrop-blur-3xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group/form">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent opacity-50" />
                        <LoginForm
                          onSubmit={handleLogin}
                          isLoading={isLoading}
                          error={error}
                          portal="infertility"
                        />
                      </div>
                    </motion.div>
                  ) : selectedPortal === "general" ? null : (
                    <motion.div
                      key="infertility-intro"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8 flex flex-col items-end lg:items-start text-right lg:text-left"
                    >
                      <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                          <Activity className="w-3 h-3" /> Specialized Care
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] mb-8 tracking-tighter">
                          Focused <br />
                          <span className="text-emerald-500">Specialty.</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                          Dedicated tools for fertility care management and
                          auditing with precise tracking.
                        </p>
                      </div>

                      <div className="hidden lg:flex gap-4">
                        {[Baby, ShieldCheck, Activity].map((Icon, i) => (
                          <div
                            key={i}
                            className="p-4 rounded-3xl bg-white/5 border border-white/5 group-hover:border-emerald-500/30 transition-all duration-500 group-hover:bg-emerald-500/10 group-hover:scale-110"
                          >
                            <Icon className="w-5 h-5 text-emerald-500" />
                          </div>
                        ))}
                      </div>

                      <div className="lg:hidden flex items-center gap-2 text-emerald-500 font-bold text-sm uppercase tracking-widest animate-pulse">
                        <ArrowLeft className="w-4 h-4" /> Tap to Enter
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            {/* Hover Decor */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[120px] -ml-32 -mt-32 group-hover:bg-emerald-600/30 group-hover:scale-150 transition-all duration-1000" />
          </motion.div>

          {/* ═══════════════ FOOTER SUPPORT ═══════════════ */}
          {!selectedPortal && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-8 left-0 right-0 z-30 flex justify-center pointer-events-none"
            >
              <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/10 px-8 py-3 rounded-full pointer-events-auto shadow-2xl">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openWhatsApp();
                  }}
                  className="flex items-center gap-4 text-[10px] font-black text-white/60 hover:text-white transition-all duration-300 group uppercase tracking-[0.3em]"
                >
                  <FaWhatsapp className="w-4 h-4 text-[#25D366] group-hover:scale-125 transition-transform" />
                  <span>Support: F.M. Ashfaq</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </LayoutGroup>
  );
}
