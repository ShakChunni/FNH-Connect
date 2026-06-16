import React from "react";
import { redirect } from "next/navigation";
import {
  AtSign,
  User,
  Briefcase,
  ShieldCheck,
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
}

function ProfileField({ label, value, icon: Icon }: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">
          {label}
        </p>
        <p className="text-sm font-semibold text-slate-800 truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

function NotProvided() {
  return <span className="text-slate-400 font-medium italic">Not provided</span>;
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
              <section className="bg-slate-50 p-4 sm:p-6 lg:p-7">
                <div className="flex flex-col gap-5">
                  {/* Header card: identity + access level + status together */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 text-xl font-black leading-none text-white shadow-md">
                        <span className="leading-none">
                          {initials.toUpperCase()}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="truncate text-xl font-black text-slate-900">
                            {user.fullName || user.username}
                          </h2>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              user.isActive
                                ? "bg-slate-800 text-white"
                                : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.isActive ? "bg-emerald-400" : "bg-rose-500"
                              }`}
                            />
                            {user.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          @{user.username}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            {getRoleDisplayName(user.role)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile fields */}
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
                    <ProfileField
                      label="Email"
                      value={user.email || <NotProvided />}
                      icon={Mail}
                    />
                    <ProfileField
                      label="Phone"
                      value={user.phoneNumber || <NotProvided />}
                      icon={Phone}
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
