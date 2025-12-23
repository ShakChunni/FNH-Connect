import Image from "next/image";

const LOGIN_VISUAL_SRC = "/jd-login-bg.jpg";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] lg:min-h-screen bg-jd-black flex items-center justify-center px-3 py-4 sm:py-8 lg:px-16 lg:py-10">
      <div className="w-full max-w-[1680px]">
        <div className="rounded-2xl sm:rounded-3xl bg-jd-porcelain shadow-[0_20px_60px_rgba(0,0,0,0.25)] min-h-[calc(100dvh-2rem)] sm:min-h-[calc(100vh-4rem)] lg:min-h-0 lg:rounded-none lg:bg-transparent lg:shadow-none relative overflow-hidden lg:overflow-visible">
          {/* Mobile Logo - Visible only on mobile */}
          <div className="pointer-events-none lg:hidden absolute top-52 sm:top-[300px] -right-16 sm:-right-28 flex h-[220px] w-[220px] sm:h-[440px] sm:w-[440px] items-center justify-center opacity-10 z-5">
            <Image
              src="/JD-BLACK.svg"
              alt=""
              width={320}
              height={320}
              className="object-contain"
            />
          </div>
          <div className="flex h-auto lg:h-full flex-col gap-6 p-3 sm:gap-8 sm:p-6 lg:grid lg:grid-cols-2 lg:gap-10 lg:p-0">
            {/* Visual Panel */}
            <div className="order-1 lg:order-2">
              <div className="relative h-[180px] sm:h-[320px] rounded-2xl sm:rounded-3xl overflow-hidden bg-jd-deep-stone lg:h-[780px] lg:rounded-3xl lg:shadow-[0_28px_72px_rgba(0,0,0,0.35)]">
                <Image
                  src={LOGIN_VISUAL_SRC}
                  alt="JD Sports geometric brand installation"
                  fill
                  priority
                  sizes="(max-width: 1023px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-jd-deep-stone/20 to-jd-sandstone/20" />
              </div>
            </div>

            {/* Form Panel */}
            <div className="relative order-2 flex flex-col items-center justify-start lg:justify-center px-1 py-4 sm:px-4 sm:py-8 lg:order-1 lg:h-[780px] lg:rounded-3xl lg:bg-jd-porcelain lg:px-16 lg:py-20 lg:shadow-[0_28px_72px_rgba(0,0,0,0.35)]">
              {/* Desktop Logo - Visible only on desktop */}
              <div className="pointer-events-none hidden lg:block absolute inset-0 overflow-hidden rounded-3xl">
                <div className="absolute -right-16 top-12 flex h-[320px] w-[320px] items-center justify-center opacity-10">
                  <Image
                    src="/JD-BLACK.svg"
                    alt=""
                    width={320}
                    height={320}
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="relative z-10 w-full max-w-[440px]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
