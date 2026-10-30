import React from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="auth-layout-wrapper" className="min-h-dvh lg:min-h-screen bg-[#020617] flex items-center justify-center p-4 lg:p-8 transition-colors duration-200 overflow-hidden relative">
      <div className="w-full max-w-[1400px] relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
