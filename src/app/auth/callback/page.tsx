"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createClient();
    // This will trigger Supabase to set the session cookie if the URL has the right params
    supabase.auth.getSession().then(() => {
      // After session is set, redirect to updatepassword
      router.replace("/updatepassword");
    });
  }, [router, searchParams]);

  return <p>Processing authentication...</p>;
}
