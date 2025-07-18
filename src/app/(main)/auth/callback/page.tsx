// Looks unnecessary? Iz to separate server vs client component

import { Suspense } from "react";
import AuthCallbackInner from "./AuthCallbackInner";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p>Processing authentication...</p>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
