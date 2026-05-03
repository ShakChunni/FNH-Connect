import React from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:min-h-screen bg-fnh-navy-dark flex items-center justify-center p-4 lg:p-8 transition-colors duration-500 overflow-hidden relative">
      {/* Decorative background blur */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fnh-blue/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />
      
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
