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
  iconTone?: "blue" | "emerald" | "amber" | "violet" | "rose" | "navy";
}

const iconToneClasses = {
  blue: "bg-sky-50 border-sky-100 text-sky-700",
  emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
  amber: "bg-amber-50 border-amber-100 text-amber-700",
  violet: "bg-violet-50 border-violet-100 text-violet-700",
  rose: "bg-rose-50 border-rose-100 text-rose-700",
  navy: "bg-slate-50 border-slate-100 text-slate-700",
};

function ProfileField({
  label,
  value,
  icon: Icon,
  iconTone = "blue",
}: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-sky-100/80 bg-white/90 p-3 shadow-sm shadow-sky-900/5">
      <div
        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconToneClasses[iconTone]}`}
      >
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">
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
              <section className="bg-sky-50 p-4 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl border border-sky-100 bg-white/85 p-4 shadow-sm shadow-sky-900/10">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-100 px-3 pb-0.5 pt-1 text-xl font-black leading-none text-slate-800 shadow-sm shadow-sky-900/10">
                          <span className="leading-none">
                            {initials.toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-2xl font-black text-slate-900">
                            {user.fullName || user.username}
                          </h2>
                          <p className="mt-1 text-xs font-semibold text-slate-500">
                            {user.username}
                          </p>
                        </div>
                      </div>
                      <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm">
                        <Activity className="h-3.5 w-3.5" />
                        {user.isActive ? "Active" : "Inactive"}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-sky-200 bg-sky-100/70 p-4 shadow-sm shadow-sky-900/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-700">
                      Access Level
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900">
                      {getRoleDisplayName(user.role)}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Role and identity are managed by admin staff.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <ProfileField
                      label="Full Name"
                      value={user.fullName || <NotProvided />}
                      icon={User}
                      iconTone="navy"
                    />
                    <ProfileField
                      label="Username"
                      value={user.username}
                      icon={AtSign}
                      iconTone="blue"
                    />
                    <ProfileField
                      label="System Role"
                      value={getRoleDisplayName(user.role)}
                      icon={ShieldCheck}
                      iconTone="emerald"
                    />
                    <ProfileField
                      label="Staff Role"
                      value={user.staffRole || <NotProvided />}
                      icon={Briefcase}
                      iconTone="amber"
                    />
                    <ProfileField
                      label="Specialization"
                      value={user.specialization || <NotProvided />}
                      icon={Stethoscope}
                      iconTone="violet"
                    />
                    <ProfileField
                      label="Email"
                      value={user.email || <NotProvided />}
                      icon={Mail}
                      iconTone="rose"
                    />
                    <ProfileField
                      label="Phone"
                      value={user.phoneNumber || <NotProvided />}
                      icon={Phone}
                      iconTone="blue"
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
