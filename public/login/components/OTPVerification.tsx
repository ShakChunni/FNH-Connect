"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useLoginOTPVerification } from "@/hooks/useAuth";
import { fetchWithCSRF } from "@/lib/fetchWithCSRF";
import { useAccurateCountdown } from "@/hooks/useAccurateCountdown";

interface OTPVerificationProps {
  email: string;
  employeeId: string;
  initialCooldownExpiresAt?: number;
  onBack: () => void;
}

export default function OTPVerification({
  email,
  employeeId,
  initialCooldownExpiresAt,
  onBack,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [resendCooldownExpiresAt, setResendCooldownExpiresAt] = useState<
    number | null
  >(initialCooldownExpiresAt ?? null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const verifyOTPMutation = useLoginOTPVerification();

  // Use industry-standard accurate countdown hook
  const { remainingSeconds, isExpired } = useAccurateCountdown({
    expiresAt: resendCooldownExpiresAt ?? Date.now(), // Use server-provided timestamp
    onExpire: () => {
      // Cooldown expired - button is now enabled
    },
  });

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    verifyOTPMutation.mutate({
      employeeId,
      email,
      otp,
    });
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setResendError(null);
    setResendSuccess(false);

    try {
      const response = await fetchWithCSRF("/api/auth/login/resend-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employeeId, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use server-provided expiration timestamp for accurate countdown
        if (response.status === 429 && data.cooldownExpiresAt) {
          setResendCooldownExpiresAt(data.cooldownExpiresAt);
        }
        throw new Error(data.message || "Failed to resend OTP");
      }

      // Set cooldown using server-provided timestamp (this is the key!)
      setResendCooldownExpiresAt(data.data.cooldownExpiresAt);
      setResendSuccess(true);
      setOtp(""); // Clear the OTP input
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (error: any) {
      setResendError(error.message);
    } finally {
      setResendLoading(false);
    }
  };

  const error = verifyOTPMutation.error?.message || resendError;
  const isCooldownActive = resendCooldownExpiresAt !== null && !isExpired;

  return (
    <div className="space-y-5 sm:space-y-10 text-left">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/JD-BLACK.svg"
            alt="JD Sports logo"
            width={160}
            height={160}
            priority
            className="h-10 w-10 sm:h-16 sm:w-16"
          />
          <span className="text-[0.625rem] sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-jd-silver">
            Verification
          </span>
        </div>
      </div>

      <div className="space-y-2 sm:space-y-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-jd-deep-stone">
          Check your inbox
        </h1>
        <p className="text-xs sm:text-sm text-jd-silver">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-jd-rich-black">{email}</span>.
          Enter it below to securely access your account.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {error && !resendSuccess && (
          <motion.div
            key="otp-error"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-red-200 bg-red-50/90 px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-600">
              <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        {resendSuccess && (
          <motion.div
            key="otp-success"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 sm:gap-3 rounded-xl sm:rounded-2xl border border-green-200 bg-green-50/90 px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-green-600">
              <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0" />
              <span>New OTP sent successfully! Please check your email.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleOTPSubmit} className="space-y-4 sm:space-y-6">
        <div>
          <Input
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            className="h-14 sm:h-16 rounded-2xl sm:rounded-3xl border border-jd-ash bg-jd-white/90 text-center text-xl sm:text-2xl font-semibold tracking-[0.4em] sm:tracking-[0.6em] text-jd-rich-black placeholder:text-jd-silver focus:border-transparent focus:ring-2 focus:ring-jd-rich-black/80"
            maxLength={6}
            disabled={verifyOTPMutation.isPending}
            autoFocus
            aria-label="One-time passcode"
          />
        </div>

        <Button
          type="submit"
          className="w-full h-11 sm:h-14 rounded-full bg-jd-rich-black text-xs sm:text-sm font-semibold text-jd-white transition hover:bg-jd-deep-stone focus-visible:ring-jd-rich-black/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          disabled={verifyOTPMutation.isPending || otp.length !== 6}
        >
          {verifyOTPMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </Button>

        {/* Resend OTP Button with accurate countdown */}
        <Button
          type="button"
          onClick={handleResendOTP}
          disabled={isCooldownActive || resendLoading}
          className="w-full h-11 sm:h-14 rounded-full bg-white border-2 border-jd-ash text-xs sm:text-sm font-semibold text-jd-rich-black transition hover:bg-jd-porcelain focus-visible:ring-jd-rich-black/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {resendLoading ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              Sending Code...
            </>
          ) : isCooldownActive ? (
            <>
              <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Resend Code ({remainingSeconds}s)
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Resend Code
            </>
          )}
        </Button>
      </form>

      <div className="flex flex-col gap-2 sm:gap-4 text-xs sm:text-sm text-jd-silver">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-semibold text-jd-rich-black transition hover:text-jd-deep-stone cursor-pointer"
          type="button"
        >
          ← Back to login
        </button>
        <p>
          Didn't receive an email? Check your spam folder or{" "}
          <Link
            href="mailto:itsupport@jdsports.com"
            className="font-semibold text-jd-rich-black underline-offset-4 transition hover:underline cursor-pointer"
          >
            contact IT support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
