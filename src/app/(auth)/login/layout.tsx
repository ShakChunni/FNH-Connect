import React from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="auth-layout-wrapper" className="min-h-dvh lg:min-h-screen bg-[#020617] flex items-center justify-center p-4 lg:p-8 transition-colors duration-700 overflow-hidden relative">
      {/* Decorative background blur */}
      <div id="auth-bg-blur-1" className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[80px] pointer-events-none opacity-35 transition-colors duration-700" />
      <div id="auth-bg-blur-2" className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none opacity-35 transition-colors duration-700" />

      <div className="w-full max-w-[1400px] relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
