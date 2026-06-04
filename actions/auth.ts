"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionResponse } from "@/types";

const registerSchema = z.object({
  firstName: z.string().min(2, "Mínimo 2 caracteres"),
  lastName: z.string().min(2, "Mínimo 2 caracteres"),
  nickname: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(20, "Máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Solo letras, números y guión bajo"),
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  curso: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function registerAction(
  formData: FormData
): Promise<ActionResponse<{ nickname: string }>> {
  const raw = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    nickname: formData.get("nickname") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    // FIX: convertir null → undefined para que Zod lo acepte como opcional
    curso: (formData.get("curso") as string | null) ?? undefined,
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Error de validación",
    };
  }

  const { firstName, lastName, nickname, email, password, curso } = parsed.data;

  // Check nickname uniqueness
  const nicknameNormalized = nickname.toLowerCase();
  const existing = await prisma.user.findUnique({
    where: { nickname: nicknameNormalized },
  });
  if (existing) {
    return { success: false, error: "Ese nickname ya está en uso" };
  }

  // Register with Supabase Auth
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nickname: nicknameNormalized, firstName, lastName },
    },
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? "Error al registrarse" };
  }

  // Create user in DB
  try {
    await prisma.user.create({
      data: {
        supabaseId: authData.user.id,
        firstName,
        lastName,
        nickname: nicknameNormalized,
        email,
        curso: curso || null,
      },
    });
  } catch (err) {
    console.error("DB user creation failed:", err);
    return { success: false, error: "Error al crear la cuenta. Intentá de nuevo." };
  }

  revalidatePath("/", "layout");
  return { success: true, data: { nickname: nicknameNormalized } };
}

export async function loginAction(
  formData: FormData
): Promise<ActionResponse> {
  const raw = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: "Email o contraseña inválidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { success: false, error: "Credenciales incorrectas" };
  }

  revalidatePath("/", "layout");
  return { success: true, data: undefined };
}

export async function logoutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function checkNicknameAction(
  nickname: string
): Promise<{ available: boolean }> {
  const existing = await prisma.user.findUnique({
    where: { nickname: nickname.toLowerCase() },
  });
  return { available: !existing };
}
