"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function signup(previousState: unknown, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get('name') as string
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as "participant" | "facilitator";

  if (!email || !password || !role) {
    return { error: "Missing required fields." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        user_role: role, 
        name,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return { 
      error: error.message,
      email: email,
      name: name,
     };
  }

  return {
    message: "Signup successful! Please check your email to confirm your account.",
    redirectTo: "/login",
    delay: 1500,
  };
}

export async function login(previousState: unknown, formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { 
      error: error.message,
      email: data.email,
    };
  }

  return {
    message: "Login successful! Redirecting to your dashboard...",
    redirectTo: "/dashboard",
    delay: 1000,
  };
}

export async function resetPassword(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email is required." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
  });

  if (error) {
    return { error: error.message };
  }

  return {
    message: "Password reset email sent! Please check your inbox.",
  };
}

export async function updatePassword(
  previousState: unknown,
  formData: FormData
) {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  return {
    message: "Password updated successfully!",
    redirectTo: "/login",
    delay: 2000,
  };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}
