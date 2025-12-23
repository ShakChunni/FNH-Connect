"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { IdCard, Lock, AlertCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePasswordLogin } from "@/hooks/useAuth";

const loginSchema = z.object({
  employeeId: z
    .string()
    .min(1, "Employee ID is required")
    .max(20, "Employee ID must be less than 20 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Employee ID can only contain letters, numbers, hyphens, and underscores"
    ),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess: (
    employeeId: string,
    email: string,
    cooldownExpiresAt?: number
  ) => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const passwordLoginMutation = usePasswordLogin();
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    passwordLoginMutation.mutate(data, {
      onSuccess: (response) => {
        if (response.success && response.data?.requiresOTP) {
          // Calculate initial cooldown (60 seconds from now)
          const cooldownExpiresAt = Date.now() + 60 * 1000;
          onSuccess(data.employeeId, response.data.email, cooldownExpiresAt);
        }
      },
    });
  };

  const error = passwordLoginMutation.error?.message;

  return (
    <div className="space-y-2 sm:space-y-4 text-left">
      <div className="flex items-center gap-2">
        <Image
          src="/JD-BLACK.svg"
          alt="JD Sports logo"
          width={160}
          height={160}
          priority
          className="h-10 w-10 sm:h-16 sm:w-16"
        />
      </div>

      <div className="space-y-2 sm:space-y-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-black leading-tight text-jd-deep-stone">
          Welcome to JD
          <br />
          People Hub
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{
              duration: 0.3,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 rounded-xl sm:rounded-2xl border border-red-200 bg-red-50/90 px-2.5 py-1.5 sm:px-4 sm:py-3 text-xs sm:text-sm text-red-600">
              <AlertCircle className="h-3.5 w-3.5 sm:h-5 sm:w-5 shrink-0" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3 sm:space-y-6"
        >
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Employee ID</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-3">
                      <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-jd-porcelain text-jd-rich-black">
                        <IdCard className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="h-4 sm:h-6 w-px bg-jd-ash/40" />
                    </div>
                    <Input
                      placeholder="Employee ID"
                      className="h-11 sm:h-14 rounded-full border border-jd-ash bg-jd-white/90 pl-15 sm:pl-20 pr-3 sm:pr-6 text-xs sm:text-sm text-jd-deep-stone placeholder:text-jd-silver focus:border-transparent focus:ring-2 focus:ring-jd-rich-black/80"
                      disabled={passwordLoginMutation.isPending}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage className="pl-3 sm:pl-4 text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <div className="pointer-events-none absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 sm:gap-3">
                      <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-jd-porcelain text-jd-rich-black">
                        <Lock className="h-3 w-3 sm:h-4 sm:w-4" />
                      </div>
                      <div className="h-4 sm:h-6 w-px bg-jd-ash/40" />
                    </div>
                    <Input
                      type={isPasswordVisible ? "text" : "password"}
                      placeholder="Password"
                      className="h-11 sm:h-14 rounded-full border border-jd-ash bg-jd-white/90 pl-15 sm:pl-20 pr-11 sm:pr-14 text-xs sm:text-sm text-jd-deep-stone placeholder:text-jd-silver focus:border-transparent focus:ring-2 focus:ring-jd-rich-black/80"
                      disabled={passwordLoginMutation.isPending}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordVisible((prev) => !prev)}
                      className="absolute right-2.5 sm:right-4 top-1/2 flex h-6 w-6 sm:h-8 sm:w-8 -translate-y-1/2 items-center justify-center rounded-full bg-jd-porcelain text-jd-rich-black transition hover:bg-jd-ash/40 cursor-pointer"
                      aria-label={
                        isPasswordVisible ? "Hide password" : "Show password"
                      }
                    >
                      {isPasswordVisible ? (
                        <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage className="pl-3 sm:pl-4 text-xs" />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full h-11 sm:h-14 rounded-full bg-jd-rich-black text-xs sm:text-sm font-semibold text-jd-white transition hover:bg-jd-deep-stone focus-visible:ring-jd-rich-black/40 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
            disabled={passwordLoginMutation.isPending}
          >
            {passwordLoginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <div className="space-y-3 sm:space-y-6">
        <div className="text-center text-xs sm:text-sm text-jd-deep-stone">
          <Link
            href="/forgot-password"
            className="font-medium text-jd-rich-black underline-offset-4 transition hover:underline cursor-pointer"
          >
            Forgot your password?
          </Link>
        </div>

        <div className="flex flex-col items-center gap-2 sm:gap-4">
          <span className="h-px w-full max-w-40 sm:max-w-60 bg-jd-ash/60" />
          <p className="text-xs sm:text-sm text-jd-silver">
            New employee?{" "}
            <Link
              href="/register"
              className="font-semibold text-jd-rich-black underline-offset-4 transition hover:underline cursor-pointer"
            >
              Complete registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
