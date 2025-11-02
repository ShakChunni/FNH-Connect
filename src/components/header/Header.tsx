"use client";

import { useAuth } from "@/app/AuthContext";

export default function Header() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <header className="relative hidden flex-col gap-4 border-b border-fnh-grey-light bg-fnh-white/95 px-6 py-6 text-fnh-navy shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-sm lg:flex lg:px-10">
      <div className="flex items-center justify-start">
        <h1 className="text-2xl font-bold text-fnh-navy">
          FNH Connect Healthcare Portal
        </h1>
      </div>
    </header>
  );
}
