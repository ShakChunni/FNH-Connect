import React from "react";
import { redirect } from "next/navigation";
import {
  AtSign,
  User,
  Briefcase,
  ShieldCheck,
  Activity,
  Stethoscope,
  KeyRound,
  Mail,
  Phone,
} from "lucide-react";
import { validateServerSession } from "@/lib/auth-validation";
import { getRoleDisplayName } from "@/lib/roles";
import { ContactInfoForm } from "./ContactInfoForm";
import { PasswordChangeForm } from "./PasswordChangeForm";

interface ProfileFieldProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "light" | "navy";
}

function ProfileField({
  label,
  value,
  icon: Icon,
  variant = "light",
}: ProfileFieldProps) {
  const isNavy = variant === "navy";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 shadow-sm ${
        isNavy
          ? "border-white/10 bg-white/5 shadow-black/10"
          : "border-sky-100/80 bg-white/90 shadow-sky-900/5"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${
          isNavy
            ? "border-white/10 bg-fnh-navy-light/40 text-white"
            : "bg-sky-50 border-sky-100 text-sky-700"
        }`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={`text-[10px] font-black uppercase tracking-widest mb-0.5 ${
            isNavy ? "text-slate-400" : "text-gray-400"
          }`}
        >
          {label}
        </p>
        <p
          className={`text-sm font-semibold truncate ${
            isNavy ? "text-slate-100" : "text-fnh-navy-dark"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function NotProvided({ variant = "light" }: { variant?: "light" | "navy" }) {
  return (
    <span
      className={`font-medium italic ${
        variant === "navy" ? "text-slate-500" : "text-gray-400"
      }`}
    >
      Not provided
    </span>
  );
}

export default async function ProfilePage() {
  const sessionResult = await validateServerSession();

  if (!sessionResult || !sessionResult.user) {
    redirect("/login");
  }

  const { user } = sessionResult;
  const initials =
    `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}` ||
    user.username.charAt(0);

  return (
    <div className="min-h-screen bg-fnh-porcelain pb-4 sm:pb-6 lg:pb-8 w-full overflow-x-hidden">
      <div className="mx-auto w-full max-w-full px-3 sm:px-4 lg:px-6 pt-16 sm:pt-12 lg:pt-2">
        <div className="space-y-4 sm:space-y-5 lg:space-y-6 w-full">
          {/* Page Header */}
          <div className="px-1 sm:px-2 lg:px-4 pb-2 lg:pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-fnh-navy-dark tracking-tight">
                  Profile
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  View your account information and manage your password
                </p>
              </div>
            </div>
          </div>

          <div className="px-1 sm:px-2 lg:px-4">
            <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm lg:grid-cols-[minmax(320px,0.78fr)_minmax(460px,1fr)]">
              <section className="relative overflow-hidden bg-gradient-to-br from-fnh-navy-dark via-fnh-navy to-fnh-navy-light p-4 sm:p-6 lg:p-7">
                {/* subtle radial glow for depth */}
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-fnh-blue/10 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative flex flex-col gap-5">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-fnh-blue to-fnh-blue-light px-3 pb-0.5 pt-1 text-xl font-black leading-none text-white shadow-lg shadow-black/20">
                          <span className="leading-none">
                            {initials.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-2xl font-black text-white">
                            {user.fullName || user.username}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-300">
                            {user.username}
                          </p>
                        </div>
                      </div>
                      <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 shadow-sm">
                        <Activity className="h-3.5 w-3.5" />
                        {user.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-fnh-navy-light/40 p-4 shadow-sm shadow-black/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-fnh-blue-light">
                      Access Level
                    </p>
                    <p className="mt-1 text-lg font-black text-white">
                      {getRoleDisplayName(user.role)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-300">
                      Role and identity are managed by admin staff.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <ProfileField
                      label="Full Name"
                      value={user.fullName || <NotProvided variant="navy" />}
                      icon={User}
                      variant="navy"
                    />
                    <ProfileField
                      label="Username"
                      value={user.username}
                      icon={AtSign}
                      variant="navy"
                    />
                    <ProfileField
                      label="System Role"
                      value={getRoleDisplayName(user.role)}
                      icon={ShieldCheck}
                      variant="navy"
                    />
                    <ProfileField
                      label="Staff Role"
                      value={user.staffRole || <NotProvided variant="navy" />}
                      icon={Briefcase}
                      variant="navy"
                    />
                    <ProfileField
                      label="Specialization"
                      value={user.specialization || <NotProvided variant="navy" />}
                      icon={Stethoscope}
                      variant="navy"
                    />
                    <ProfileField
                      label="Email"
                      value={user.email || <NotProvided variant="navy" />}
                      icon={Mail}
                      variant="navy"
                    />
                    <ProfileField
                      label="Phone"
                      value={user.phoneNumber || <NotProvided variant="navy" />}
                      icon={Phone}
                      variant="navy"
                    />
                  </div>
                </div>
              </section>

              <section className="bg-white p-4 sm:p-6 lg:p-7">
                <div className="space-y-6">
                  <div>
                    <div className="mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-sky-700" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-fnh-navy-dark">
                          Contact Details
                        </h3>
                        <p className="text-xs text-gray-500">
                          Click edit to update your email or phone number.
                        </p>
                      </div>
                    </div>

                    <ContactInfoForm
                      initialEmail={user.email || ""}
                      initialPhoneNumber={user.phoneNumber || ""}
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-6">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <KeyRound className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-fnh-navy-dark">
                          Change Password
                        </h3>
                        <p className="text-xs text-gray-500">
                          Generate a strong password or enter your own.
                        </p>
                      </div>
                    </div>

                    <PasswordChangeForm />
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
