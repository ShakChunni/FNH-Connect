import Image from "next/image";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:min-h-screen bg-fnh-navy-dark flex items-center justify-center p-4 lg:p-8 transition-colors duration-500">
      {/* Outer Container - improved separation: lighter right side, distinct shadow */}
      <div className="w-full max-w-[1400px] min-h-[600px] lg:h-[800px] rounded-3xl overflow-hidden bg-white shadow-2xl ring-1 ring-white/10 flex flex-col lg:flex-row relative">
        {/* Left Panel: Form Section - Clean White */}
        <div className="relative z-10 w-full lg:w-[45%] bg-white flex flex-col items-center justify-center p-8 sm:p-12 lg:p-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        {/* Right Panel: Visual/Brand Section - Lighter separation as requested */}
        <div className="relative hidden lg:flex flex-1 bg-fnh-navy items-center justify-center overflow-hidden">
          {/* Lighter Gradient Background for separation */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#2c3e50] via-fnh-navy to-[#1a2533] z-0" />

          {/* Content */}
          <div className="relative z-10 p-12 text-center max-w-lg">
            <div className="w-40 h-40 mx-auto mb-10 bg-white/5 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/10 shadow-xl transition-colors duration-300 hover:bg-white/10 hover:border-white/20">
              <Image
                src="/fnh-logo.svg"
                alt="FNH Logo"
                width={100}
                height={100}
                className="object-contain brightness-0 invert opacity-90"
              />
            </div>
            <h2 className="text-3xl font-bold text-white mb-6 tracking-tight">
              FNH Connect Portal
            </h2>
            <p className="text-fnh-grey-light text-lg leading-relaxed font-light">
              Authorized personnel access only. Please sign in to manage patient
              records, appointments, and hospital resources securly.
            </p>
          </div>

          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" />
        </div>
      </div>
    </div>
  );
}
