"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Microscope,
  ShieldCheck,
  Users,
  Stethoscope,
  TestTubes,
  Check,
} from "lucide-react";
import { useAuth } from "@/app/AuthContext";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import { LoginForm } from "./LoginForm";
import { cn } from "@/lib/utils";
import type { LoginFormData, LoginResponse } from "../types";
import type { PortalType } from "@/types/auth";
import { version } from "@/../package.json";

const APP_VERSION = `v${version}`;

const PORTAL_META: Record<
  PortalType,
  {
    label: string;
    title: string;
    description: string;
    accentText: string;
    accentBg: string;
    accentRing: string;
    accentBorder: string;
    accentGlow: string;
    icon: React.ComponentType<{ className?: string }>;
    pills: Array<{ icon: React.ComponentType<{ className?: string }>; label: string }>;
  }
> = {
  general: {
    label: "General",
    title: "General Admissions & Pathology",
    description:
      "Access the central system for general patient admissions, pathology records, and hospital operations.",
    accentText: "text-blue-400",
    accentBg: "bg-blue-500",
    accentRing: "ring-blue-500/40",
    accentBorder: "border-blue-500/40",
    accentGlow: "shadow-[0_0_30px_-10px_rgba(59,130,246,0.6)]",
    icon: Building2,
    pills: [
      { icon: Stethoscope, label: "Admissions" },
      { icon: Users, label: "Patients" },
      { icon: ShieldCheck, label: "Secure" },
    ],
  },
  infertility: {
    label: "HSI Center",
    title: "HSI Center Specialty",
    description:
      "Access the dedicated portal for HSI treatments, related diagnostics, and specialized patient management.",
    accentText: "text-emerald-400",
    accentBg: "bg-emerald-500",
    accentRing: "ring-emerald-500/40",
    accentBorder: "border-emerald-500/40",
    accentGlow: "shadow-[0_0_30px_-10px_rgba(16,185,129,0.6)]",
    icon: Microscope,
    pills: [
      { icon: Microscope, label: "Diagnostics" },
      { icon: ShieldCheck, label: "Secure" },
      { icon: TestTubes, label: "Lab" },
    ],
  },
};

export function MobileLogin() {
  const { login } = useAuth();
  const [selectedPortal, setSelectedPortal] = useState<PortalType>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handlePortalChange = (portal: PortalType) => {
    if (selectedPortal === portal) return;
    setSelectedPortal(portal);
    setError(null);
  };

  const meta = PORTAL_META[selectedPortal];
  const PortalIcon = meta.icon;

  return (
    <div className="min-h-dvh w-full bg-[#020617] text-white relative overflow-x-hidden">
      {/* ── Background ambient lights ── */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={`blur-top-${selectedPortal}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "absolute top-[-25%] left-[-20%] w-[80%] h-[60%] rounded-full blur-[120px] opacity-50",
              selectedPortal === "infertility" ? "bg-emerald-500/30" : "bg-blue-500/30",
            )}
          />
          <motion.div
            key={`blur-bottom-${selectedPortal}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className={cn(
              "absolute bottom-[-25%] right-[-20%] w-[80%] h-[60%] rounded-full blur-[120px] opacity-40",
              selectedPortal === "infertility" ? "bg-emerald-700/30" : "bg-blue-700/20",
            )}
          />
        </AnimatePresence>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* ── Safe-area aware header ── */}
      <header
        className="px-5 pb-3 flex items-center justify-between"
        style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
      >
        <div className="leading-tight">
          <p className="text-lg font-black tracking-tight text-white">
            Welcome
          </p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">
            Select a portal to sign in
          </p>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
          Secure
        </p>
      </header>

      {/* ── Main content ── */}
      <main
        className="px-5 pb-6"
        style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
      >
        {/* Portal Segmented Control */}
        <div className="mt-2 mb-5">
          <div
            role="tablist"
            aria-label="Select portal"
            className="grid grid-cols-2 gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-xl"
          >
            {(Object.keys(PORTAL_META) as PortalType[]).map((portal) => {
              const isActive = selectedPortal === portal;
              const portalMeta = PORTAL_META[portal];
              const Icon = portalMeta.icon;
              return (
                <button
                  key={portal}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handlePortalChange(portal)}
                  className={cn(
                    "relative h-12 px-3 rounded-xl text-xs font-black uppercase tracking-wider",
                    "flex items-center justify-center gap-2",
                    "transition-all duration-300 cursor-pointer select-none",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#020617]",
                    isActive
                      ? cn(
                          "text-white",
                          portal === "infertility"
                            ? "bg-emerald-600 focus:ring-emerald-500"
                            : "bg-blue-600 focus:ring-blue-500",
                        )
                      : "text-white/60 hover:text-white hover:bg-white/5 focus:ring-white/20",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="truncate">{portalMeta.label}</span>
                  {isActive && (
                    <Check className="w-3.5 h-3.5 absolute top-1.5 right-1.5 opacity-70" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Portal Title + Description */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPortal}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-5"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border",
                  "bg-white/5 border-white/10",
                  meta.accentGlow,
                )}
              >
                <PortalIcon className={cn("w-6 h-6", meta.accentText)} />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black tracking-tight leading-tight text-white">
                  {meta.title}
                </h1>
                <p className="mt-1 text-xs text-white/60 leading-relaxed">
                  {meta.description}
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div className="mt-4 flex flex-wrap gap-2">
              {meta.pills.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
                    "bg-white/5 border border-white/10",
                    "text-[10px] font-black uppercase tracking-wider text-white/70",
                  )}
                >
                  <Icon className={cn("w-3 h-3", meta.accentText)} />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Login Form Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPortal}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className={cn(
              "relative overflow-hidden rounded-3xl border backdrop-blur-2xl",
              "bg-slate-900/80",
              meta.accentBorder,
              "shadow-2xl",
            )}
          >
            <div
              className={cn(
                "absolute inset-0 opacity-30 pointer-events-none",
                "bg-gradient-to-br",
                selectedPortal === "infertility"
                  ? "from-emerald-600/20 via-transparent to-transparent"
                  : "from-blue-600/20 via-transparent to-transparent",
              )}
            />
            <div className="relative p-5">
              <LoginForm
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={error}
                portal={selectedPortal}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        <p className="mt-5 text-center text-[10px] font-bold uppercase tracking-[0.28em] text-white/30">
          {APP_VERSION}
        </p>
      </main>
    </div>
  );
}
