import React from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div id="auth-layout-wrapper" className="min-h-dvh lg:min-h-screen bg-[#020617] flex items-center justify-center p-4 lg:p-8 transition-colors duration-1000 overflow-hidden relative">
      {/* Decorative background blur */}
      <div id="auth-bg-blur-1" className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none opacity-50 transition-colors duration-1000" />
      <div id="auth-bg-blur-2" className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none opacity-50 transition-colors duration-1000" />
      
      {/* Grid Pattern Overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="w-full max-w-[1400px] relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
