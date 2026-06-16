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
} from "lucide-react";
import { validateServerSession } from "@/lib/auth-validation";
import { getRoleDisplayName } from "@/lib/roles";
import { ContactInfoForm } from "./ContactInfoForm";
import { PasswordChangeForm } from "./PasswordChangeForm";

interface ProfileFieldProps {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
}

function ProfileField({ label, value, icon: Icon }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/50 border border-gray-100">
      <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm">
        <Icon className="w-4 h-4 text-fnh-blue" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-fnh-navy-dark truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function NotProvided() {
  return <span className="text-gray-400 font-medium italic">Not provided</span>;
}

export default async function ProfilePage() {
  const sessionResult = await validateServerSession();

  if (!sessionResult || !sessionResult.user) {
    redirect("/login");
  }

  const { user } = sessionResult;

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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 bg-gradient-to-r from-fnh-navy to-fnh-navy-dark px-4 py-5 sm:px-6 lg:px-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-lg font-black text-white ring-1 ring-white/20">
                      {user.firstName?.charAt(0)}
                      {user.lastName?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-xl font-black text-white">
                        {user.fullName || user.username}
                      </h2>
                      <p className="mt-1 text-xs font-semibold text-white/70">
                        {user.username} · {getRoleDisplayName(user.role)}
                      </p>
                    </div>
                  </div>
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white ring-1 ring-white/15">
                    <Activity className="h-3.5 w-3.5" />
                    {user.isActive ? "Active Account" : "Inactive Account"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[minmax(320px,0.85fr)_minmax(420px,0.75fr)]">
                <section className="p-4 sm:p-5 lg:p-6 lg:border-r lg:border-gray-100">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-black text-fnh-navy-dark">
                        Account Details
                      </h3>
                      <p className="text-xs text-gray-500">
                        These details are read-only and managed by admin staff.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <ProfileField
                      label="Full Name"
                      value={user.fullName || <NotProvided />}
                      icon={User}
                    />
                    <ProfileField
                      label="Username"
                      value={user.username}
                      icon={AtSign}
                    />
                    <ProfileField
                      label="System Role"
                      value={getRoleDisplayName(user.role)}
                      icon={ShieldCheck}
                    />
                    <ProfileField
                      label="Staff Role"
                      value={user.staffRole || <NotProvided />}
                      icon={Briefcase}
                    />
                    <ProfileField
                      label="Specialization"
                      value={user.specialization || <NotProvided />}
                      icon={Stethoscope}
                    />
                  </div>

                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <ContactInfoForm
                      initialEmail={user.email || ""}
                      initialPhoneNumber={user.phoneNumber || ""}
                    />
                  </div>
                </section>

                <section className="border-t border-gray-100 p-4 sm:p-5 lg:border-t-0 lg:p-6">
                  <div>
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
                </section>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
