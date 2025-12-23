"use client";

import { useState } from "react";
import LoginForm from "./components/LoginForm";
import OTPVerification from "./components/OTPVerification";

export default function LoginPage() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [credentials, setCredentials] = useState<{
    employeeId: string;
    email: string;
    initialCooldownExpiresAt?: number;
  } | null>(null);

  const handleLoginSuccess = (
    employeeId: string,
    email: string,
    cooldownExpiresAt?: number
  ) => {
    setCredentials({
      employeeId,
      email,
      initialCooldownExpiresAt: cooldownExpiresAt,
    });
    setStep("otp");
  };

  const handleBack = () => {
    setStep("login");
    setCredentials(null);
  };

  return (
    <>
      {step === "login" && <LoginForm onSuccess={handleLoginSuccess} />}

      {step === "otp" && credentials && (
        <OTPVerification
          email={credentials.email}
          employeeId={credentials.employeeId}
          initialCooldownExpiresAt={credentials.initialCooldownExpiresAt}
          onBack={handleBack}
        />
      )}
    </>
  );
}

