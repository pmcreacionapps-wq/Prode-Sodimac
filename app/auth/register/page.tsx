"use client";

import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDebouncedCallback } from "use-debounce";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { registerAction, checkNicknameAction } from "@/actions/auth";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  firstName: z.string().min(2, "At least 2 characters"),
  lastName: z.string().min(2, "At least 2 characters"),
  nickname: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "Max 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, underscores only"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
  curso: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

type NicknameStatus = "idle" | "checking" | "available" | "taken";

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [nicknameStatus, setNicknameStatus] = useState<NicknameStatus>("idle");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const checkNickname = useDebouncedCallback(async (value: string) => {
    if (value.length < 3 || !/^[a-zA-Z0-9_]+$/.test(value)) return;
    setNicknameStatus("checking");
    const { available } = await checkNicknameAction(value);
    setNicknameStatus(available ? "available" : "taken");
  }, 500);

  const onSubmit = (data: FormData) => {
    if (nicknameStatus === "taken") {
      toast({ title: "That nickname is already taken", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => v && formData.set(k, v as string));

      const result = await registerAction(formData);

      if (result.success) {
        toast({ title: "Account created! Welcome 🎉" });
        router.push("/fixture");
        router.refresh();
      } else {
        toast({ title: result.error, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600">
            <span className="text-white font-bold text-xl">N</span>
          </div>
          <h1 className="text-xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">Join Next World Cup 2026</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                First name
              </label>
              <input
                {...register("firstName")}
                placeholder="Ana"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-400">{errors.firstName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Last name
              </label>
              <input
                {...register("lastName")}
                placeholder="García"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-400">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nickname <span className="text-slate-500">(public, unique)</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
              <input
                {...register("nickname", {
                  onChange: (e) => checkNickname(e.target.value),
                })}
                placeholder="goat_predictor"
                className="w-full rounded-xl border border-slate-700 bg-slate-800/50 pl-8 pr-10 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nicknameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                )}
                {nicknameStatus === "available" && (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                {nicknameStatus === "taken" && (
                  <XCircle className="h-4 w-4 text-red-400" />
                )}
              </div>
            </div>
            {errors.nickname && (
              <p className="mt-1 text-xs text-red-400">{errors.nickname.message}</p>
            )}
            {nicknameStatus === "taken" && (
              <p className="mt-1 text-xs text-red-400">Nickname already taken</p>
            )}
            {nicknameStatus === "available" && (
              <p className="mt-1 text-xs text-green-400">Nickname available ✓</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
            <input
              {...register("email")}
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
            <input
              {...register("password")}
              type="password"
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
            )}
          </div>

          {/* Curso (optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Class <span className="text-slate-500">(optional)</span>
            </label>
            <input
              {...register("curso")}
              placeholder="e.g. Upper Intermediate B"
              className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || nicknameStatus === "taken"}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
