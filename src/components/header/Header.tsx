"use client";

import { useAuth } from "@/app/AuthContext";

export default function Header() {
  const { user, portal } = useAuth();

  if (!user) return null;

  const isInfertility = portal === "infertility";

  return (
    <header className="relative hidden flex-col gap-4 border-b border-fnh-grey-light bg-fnh-white px-6 py-6 text-fnh-navy lg:flex lg:px-8">
      <div className="flex items-center justify-start">
        <h1 className="text-2xl font-bold text-fnh-navy">
          {isInfertility ? "HSI Infertility Portal" : "FNH Connect Healthcare Portal"}
        </h1>
      </div>
    </header>
  );
}
