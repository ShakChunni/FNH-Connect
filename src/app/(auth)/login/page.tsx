"use client";

import React, { useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/app/AuthContext";
import { LoginForm } from "./components";
import { MobileLogin } from "./components/MobileLogin";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import type { LoginFormData, LoginResponse } from "./types";
import type { PortalType } from "@/types/auth";
import {
  Building2,
  Microscope,
  ShieldCheck,
  Users,
  ArrowLeft,
  ArrowRight,
  Stethoscope,
  TestTubes,
} from "lucide-react";
import { cn } from "@/lib/utils";

const APP_VERSION = "v1.1.2";
const SOFT_EASE = [0.16, 1, 0.3, 1] as const;
const BACKGROUND_TRANSITION_CLASS =
  "transition-colors duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)]";
const BACKGROUND_BLUR_BASE_CLASS =
  "fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none opacity-50";
const BACKGROUND_BLUR_SECONDARY_CLASS =
  "fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] pointer-events-none opacity-50";
const PANEL_TRANSITION = {
  flexBasis: { duration: 1.08, ease: SOFT_EASE },
  opacity: { duration: 0.9, ease: SOFT_EASE },
  scale: { duration: 0.7, ease: SOFT_EASE },
} as const;
const ACTIVE_PORTAL_TRANSITION = {
  duration: 0.7,
  delay: 0.34,
  ease: SOFT_EASE,
} as const;
const INTRO_PORTAL_TRANSITION = {
  duration: 0.58,
  ease: SOFT_EASE,
} as const;
const PORTAL_EXIT_TRANSITION = {
  duration: 0.34,
  ease: SOFT_EASE,
} as const;
const HEADER_TEXT_TRANSITION = {
  duration: 0.46,
  ease: SOFT_EASE,
} as const;
const activePortalMotion = {
  initial: { opacity: 0, y: 18, scale: 0.985, filter: "blur(10px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.99,
    filter: "blur(8px)",
    transition: PORTAL_EXIT_TRANSITION,
  },
} as const;
const introPortalMotion = {
  initial: { opacity: 0, y: 14, scale: 0.99, filter: "blur(8px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.992,
    filter: "blur(8px)",
    transition: PORTAL_EXIT_TRANSITION,
  },
} as const;
const headerTextMotion = {
  initial: { opacity: 0, y: 8, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    y: -6,
    filter: "blur(6px)",
    transition: PORTAL_EXIT_TRANSITION,
  },
} as const;
const PORTAL_LOGOS: Record<
  PortalType,
  {
    src: string;
    alt: string;
    width: number;
    height: number;
    wrapperClassName: string;
    imageClassName: string;
  }
> = {
  general: {
    src: "/fnh-logo.png",
    alt: "Feroza Nursing Home logo",
    width: 433,
    height: 496,
    wrapperClassName: "border-blue-400/40 bg-blue-950/40",
    imageClassName: "scale-125",
  },
  infertility: {
    src: "/hsi-logo.png",
    alt: "HSI Center logo",
    width: 500,
    height: 500,
    wrapperClassName: "border-emerald-300/30 bg-emerald-950/25",
    imageClassName: "scale-125",
  },
};

function PortalLogo({
  portal,
  size = "header",
}: {
  portal: PortalType;
  size?: "header" | "rail";
}) {
  const logo = PORTAL_LOGOS[portal];

  return (
    <div
      className={cn(
        "shrink-0 flex items-center justify-center overflow-hidden border shadow-2xl transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
        size === "rail"
          ? "h-20 w-20 rounded-3xl p-2"
          : "h-12 w-12 rounded-2xl p-1.5 lg:h-14 lg:w-14",
        logo.wrapperClassName,
      )}
    >
      <Image
        src={logo.src}
        alt={logo.alt}
        width={logo.width}
        height={logo.height}
        priority
        className={cn(
          "h-full w-full object-contain",
          logo.imageClassName,
          size === "rail" ? "drop-shadow-[0_18px_30px_rgba(0,0,0,0.28)]" : "",
        )}
      />
    </div>
  );
}

function VersionBadge({ portal }: { portal?: PortalType }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.22em] shadow-lg backdrop-blur-xl",
        portal === "infertility"
          ? "border-emerald-300/20 bg-emerald-950/40 text-emerald-100/70"
          : "border-blue-300/20 bg-slate-950/35 text-blue-100/70",
      )}
    >
      {APP_VERSION}
    </span>
  );
}

function PortalTopBar({
  portal,
  onBack,
}: {
  portal: PortalType;
  onBack: () => void;
}) {
  return (
    <div className="mb-10 flex items-center justify-between gap-4">
      <button
        type="button"
        onClick={onBack}
        className="group/back flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.3em] text-white/50 transition-all hover:border-white/20 hover:text-white"
      >
        <ArrowLeft className="h-3 w-3 transition-transform group-hover/back:-translate-x-1" />{" "}
        Back to Portals
      </button>
      <VersionBadge portal={portal} />
    </div>
  );
}

function CompactPortalRail({
  portal,
  label,
  description,
}: {
  portal: PortalType;
  label: string;
  description: string;
}) {
  return (
    <motion.div
      key={`${portal}-rail`}
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 0.99,
        transition: PORTAL_EXIT_TRANSITION,
      }}
      transition={{ duration: 0.38, ease: SOFT_EASE }}
      className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 text-center will-change-[opacity,transform]"
    >
      <PortalLogo portal={portal} size="rail" />
      <div className="space-y-1">
        <p className="text-sm font-black uppercase tracking-[0.22em] text-white/80">
          {label}
        </p>
        <p className="mx-auto max-w-[7rem] text-[10px] font-bold uppercase leading-relaxed tracking-[0.18em] text-white/35">
          {description}
        </p>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <>
      {/* Mobile (< lg): new segmented-control layout */}
      <div className="lg:hidden">
        <MobileLogin />
      </div>
      {/* Desktop (lg+): original two-panel split-screen layout, untouched */}
      <div className="hidden w-full lg:block">
        <LoginPageDesktop />
      </div>
    </>
  );
}

function LoginPageDesktop() {
  const { login } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<PortalType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync body background and layout wrapper with selected portal
  React.useEffect(() => {
    const wrapper = document.getElementById("auth-layout-wrapper");
    const blur1 = document.getElementById("auth-bg-blur-1");
    const blur2 = document.getElementById("auth-bg-blur-2");
    
    if (selectedPortal === "infertility") {
      document.documentElement.style.backgroundColor = "#022c22";
      document.body.style.backgroundColor = "#022c22";
      if (wrapper) wrapper.style.backgroundColor = "#022c22";
      if (blur1) blur1.className = `${BACKGROUND_BLUR_BASE_CLASS} bg-emerald-500/20 ${BACKGROUND_TRANSITION_CLASS}`;
      if (blur2) blur2.className = `${BACKGROUND_BLUR_SECONDARY_CLASS} bg-emerald-700/20 ${BACKGROUND_TRANSITION_CLASS}`;
    } else if (selectedPortal === "general") {
      document.documentElement.style.backgroundColor = "#020617";
      document.body.style.backgroundColor = "#020617";
      if (wrapper) wrapper.style.backgroundColor = "#020617";
      if (blur1) blur1.className = `${BACKGROUND_BLUR_BASE_CLASS} bg-blue-500/20 ${BACKGROUND_TRANSITION_CLASS}`;
      if (blur2) blur2.className = `${BACKGROUND_BLUR_SECONDARY_CLASS} bg-blue-700/10 ${BACKGROUND_TRANSITION_CLASS}`;
    } else {
      document.documentElement.style.backgroundColor = "#020617";
      document.body.style.backgroundColor = "#020617";
      if (wrapper) wrapper.style.backgroundColor = "#020617";
      if (blur1) blur1.className = `${BACKGROUND_BLUR_BASE_CLASS} bg-blue-500/20 ${BACKGROUND_TRANSITION_CLASS}`;
      if (blur2) blur2.className = `${BACKGROUND_BLUR_SECONDARY_CLASS} bg-purple-500/10 ${BACKGROUND_TRANSITION_CLASS}`;
    }
    return () => {
      document.documentElement.style.backgroundColor = "";
      document.body.style.backgroundColor = "";
      if (wrapper) wrapper.style.backgroundColor = "";
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

  const handlePortalClick = (portal: PortalType) => {
    if (selectedPortal !== portal) {
      setSelectedPortal(portal);
      setError(null);
    }
  };

  return (
      <div className="w-full flex items-center justify-center p-0 sm:p-4 lg:p-6 min-h-screen lg:min-h-0">
        <div className="w-full max-w-[1280px] bg-slate-950 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col lg:flex-row relative min-h-[700px] lg:h-[820px] border border-white/5">
          {/* ═══════════════ LEFT PANEL: GENERAL HOSPITAL ═══════════════ */}
          <motion.div
            onClick={() => handlePortalClick("general")}
            whileHover={!selectedPortal ? { scale: 1.005 } : {}}
            animate={{
              flexBasis:
                selectedPortal === "general"
                  ? "calc(100% - 11rem)"
                  : selectedPortal === "infertility"
                    ? "11rem"
                    : "50%",
              opacity: selectedPortal === "infertility" ? 0.62 : 1,
            }}
            transition={PANEL_TRANSITION}
            className={cn(
              "relative min-w-0 flex-none flex flex-col h-full cursor-pointer group overflow-hidden will-change-[flex-basis,opacity]",
              selectedPortal === "general"
                ? "h-full z-20 cursor-default"
                : selectedPortal === "infertility"
                  ? "z-10"
                  : "z-10",
            )}
          >
            {/* Background & Lighting Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#020617] z-0" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tr from-blue-500 via-transparent to-transparent z-0" />

            {selectedPortal === "infertility" ? (
              <CompactPortalRail
                portal="general"
                label="FNH"
                description="General Portal"
              />
            ) : (
            <div className="relative z-10 flex h-full flex-col p-6 lg:p-14">
              {/* Header */}
              <motion.div
                className="flex items-center justify-start gap-4"
              >
                <PortalLogo portal="general" />
                <motion.div
                  key="general-title"
                  {...headerTextMotion}
                  transition={HEADER_TEXT_TRANSITION}
                >
                  <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight uppercase">
                    FNH <span className="text-blue-500">Connect</span>
                  </h1>
                  <p className="text-[10px] font-bold text-blue-400/60 uppercase tracking-[0.3em]">
                    Hospital Management
                  </p>
                </motion.div>
              </motion.div>

              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  {selectedPortal === "general" ? (
                    <motion.div
                      key="general-active"
                      {...activePortalMotion}
                      transition={ACTIVE_PORTAL_TRANSITION}
                      className="absolute inset-0 flex flex-col justify-center will-change-[opacity,transform,filter]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mx-auto w-full max-w-md">
                        <PortalTopBar
                          portal="general"
                          onBack={() => setSelectedPortal(null)}
                        />
                        <div className="mb-10">
                          <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
                            General Admissions <br />
                            & Pathology.
                          </h2>
                          <p className="text-blue-200/60 text-sm font-medium leading-relaxed">
                            Access the central system for general patient admissions, pathology records, and hospital operations.
                          </p>
                        </div>
                        <div className="bg-[#0f172a]/90 backdrop-blur-3xl border border-blue-500/20 p-6 lg:p-8 rounded-[2.5rem] shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)] relative overflow-hidden group/form">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                          <div className="relative z-10">
                            <LoginForm
                              onSubmit={handleLogin}
                              isLoading={isLoading}
                              error={error}
                              portal="general"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="general-intro"
                      {...introPortalMotion}
                      transition={{
                        ...INTRO_PORTAL_TRANSITION,
                        delay: selectedPortal ? 0.22 : 0.08,
                      }}
                      className="absolute inset-0 flex flex-col justify-center will-change-[opacity,transform,filter]"
                    >
                      <div className="w-[28rem] space-y-8">
                        <div className="max-w-md">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                          <Building2 className="w-3 h-3" /> System Primary
                        </div>
                        <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] mb-8 tracking-tighter">
                          General <br />
                          <span className="text-blue-600">Operations.</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                          Manage admissions, pathology, and hospital-wide patient records in one unified interface.
                        </p>
                        </div>

                        <div className="hidden lg:flex gap-4">
                          {[Stethoscope, Users, ShieldCheck].map((Icon, i) => (
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            )}
            {/* Hover Decor */}
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[120px] -mr-32 -mb-32 group-hover:bg-blue-600/30 group-hover:scale-150 transition-all duration-1000" />
          </motion.div>

          {/* ═══════════════ RIGHT PANEL: INFERTILITY ═══════════════ */}
          <motion.div
            onClick={() => handlePortalClick("infertility")}
            whileHover={!selectedPortal ? { scale: 1.005 } : {}}
            animate={{
              flexBasis:
                selectedPortal === "infertility"
                  ? "calc(100% - 11rem)"
                  : selectedPortal === "general"
                    ? "11rem"
                    : "50%",
              opacity: selectedPortal === "general" ? 0.62 : 1,
            }}
            transition={PANEL_TRANSITION}
            className={cn(
              "relative min-w-0 flex-none flex flex-col h-full cursor-pointer group overflow-hidden will-change-[flex-basis,opacity]",
              selectedPortal === "infertility"
                ? "h-full z-20 cursor-default"
                : selectedPortal === "general"
                  ? "z-10"
                  : "z-10",
            )}
          >
            {/* Background & Lighting Decor */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#111827] via-[#064e3b] to-[#022c22] z-0" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-tl from-emerald-500 via-transparent to-transparent z-0" />

            {selectedPortal === "general" ? (
              <CompactPortalRail
                portal="infertility"
                label="HSI"
                description="Specialty Portal"
              />
            ) : (
            <div className="relative z-10 flex h-full flex-col p-6 lg:p-14">
              {/* Header */}
              <motion.div
                className="flex items-center gap-4 justify-start lg:justify-end lg:flex-row-reverse"
              >
                <PortalLogo portal="infertility" />
                <motion.div
                  key="infertility-title"
                  {...headerTextMotion}
                  transition={HEADER_TEXT_TRANSITION}
                  className="text-right"
                >
                  <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight uppercase">
                     HSI <span className="text-emerald-500">Center</span>
                  </h1>
                  <p className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-[0.3em]">
                     Infertility Portal
                  </p>
                </motion.div>
              </motion.div>

              <div className="relative flex-1 overflow-hidden">
                <AnimatePresence initial={false} mode="popLayout">
                  {selectedPortal === "infertility" ? (
                    <motion.div
                      key="infertility-active"
                      {...activePortalMotion}
                      transition={ACTIVE_PORTAL_TRANSITION}
                      className="absolute inset-0 flex flex-col justify-center will-change-[opacity,transform,filter]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mx-auto w-full max-w-md">
                        <PortalTopBar
                          portal="infertility"
                          onBack={() => setSelectedPortal(null)}
                        />
                        <div className="mb-10 lg:text-left text-right">
                           <h2 className="text-4xl lg:text-5xl font-black text-white mb-4 tracking-tighter leading-none">
                             HSI Center <br />
                             Specialty.
                           </h2>
                           <p className="text-emerald-200/60 text-sm font-medium leading-relaxed">
                             Access the dedicated portal for HSI treatments, related diagnostics, and specialized patient management.
                           </p>
                        </div>
                        <div className="bg-[#022c22]/90 backdrop-blur-3xl border border-emerald-500/20 p-6 lg:p-8 rounded-[2.5rem] shadow-[0_0_40px_-15px_rgba(16,185,129,0.3)] relative overflow-hidden group/form">
                          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                          <div className="relative z-10">
                            <LoginForm
                              onSubmit={handleLogin}
                              isLoading={isLoading}
                              error={error}
                              portal="infertility"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="infertility-intro"
                      {...introPortalMotion}
                      transition={{
                        ...INTRO_PORTAL_TRANSITION,
                        delay: selectedPortal ? 0.22 : 0.08,
                      }}
                      className="absolute inset-0 flex flex-col items-end justify-center text-right will-change-[opacity,transform,filter] lg:items-start lg:text-left"
                    >
                      <div className="w-[28rem] space-y-8">
                        <div className="max-w-md">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                            <Microscope className="w-3 h-3" /> Infertility Care
                          </div>
                           <h2 className="text-5xl lg:text-7xl font-black text-white leading-[0.9] mb-8 tracking-tighter">
                             HSI Center <br />
                             <span className="text-emerald-500">Unit.</span>
                           </h2>
                           <p className="text-lg text-slate-400 leading-relaxed font-medium">
                             Dedicated tools for HSI diagnostics, treatment planning, and specialized management.
                           </p>
                        </div>

                        <div className="hidden lg:flex gap-4">
                          {[Microscope, ShieldCheck, TestTubes].map((Icon, i) => (
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
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
            )}
            {/* Hover Decor */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[120px] -ml-32 -mt-32 group-hover:bg-emerald-600/30 group-hover:scale-150 transition-all duration-1000" />
          </motion.div>

          {!selectedPortal ? (
            <div className="pointer-events-none absolute bottom-6 left-0 right-0 z-30 flex justify-center">
              <VersionBadge />
            </div>
          ) : null}
        </div>
      </div>
  );
}
