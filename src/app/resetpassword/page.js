'use client'

import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();
  return (
    <div>
    <h1>Do you also forget your moms birthday???</h1>
    <button onClick={() => router.push("/login")}>
    Back to Log in
  </button>
  </div>
  )
}