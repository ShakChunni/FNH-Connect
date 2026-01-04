import Image from "next/image";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:min-h-screen bg-fnh-navy-dark flex items-center justify-center p-4 lg:p-8 transition-colors duration-500 overflow-hidden">
      {/* Decorative background blur */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-fnh-blue/20 rounded-full blur-[120px] pointer-events-none opacity-50" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none opacity-50" />

      {/* Outer Container - Premium Card Style */}
      <div className="w-full max-w-[1240px] min-h-[600px] lg:min-h-[750px] lg:h-auto rounded-[32px] overflow-hidden bg-white shadow-2xl ring-1 ring-white/10 flex flex-col lg:flex-row relative z-10 transition-all duration-300">
        {/* Left Panel: Form Section - Clean White */}
        <div className="relative z-10 w-full lg:w-[48%] bg-white flex flex-col items-center justify-center p-8 sm:p-12 lg:p-20 xl:p-24">
          <div className="w-full max-w-[440px]">{children}</div>
        </div>

        {/* Right Panel: Visual/Brand Section */}
        <div className="relative hidden lg:flex flex-1 bg-fnh-navy items-center justify-center overflow-hidden">
          {/* Enhanced Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-fnh-navy-light via-fnh-navy to-fnh-navy-dark z-0" />

          {/* Geometric Accents */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-fnh-blue/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

          {/* Content */}
          <div className="relative z-10 p-12 text-center max-w-lg">
            <div className="w-32 h-32 mx-auto mb-10 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl ring-1 ring-white/10 transform transition-transform duration-500 hover:scale-105 hover:rotate-3">
              <Image
                src="/fnh-logo.svg"
                alt="FNH Logo"
                width={80}
                height={80}
                className="object-contain brightness-0 invert drop-shadow-md"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight drop-shadow-sm">
              FNH Connect Portal
            </h2>
            <p className="text-fnh-grey-light text-base leading-relaxed font-light opacity-90 max-w-md mx-auto">
              Authorized personnel access only. Please sign in to manage patient
              records, appointments, and hospital resources securely.
            </p>
          </div>

          {/* Subtle Grid Pattern Overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
