import { TestCustomClaims } from "../components/TestCustomClaims";

export default function TestClaimsPage() {
  return (
    <div>
      <h1>Test Custom Claims</h1>
      <p>
        This page is for testing custom claims in Supabase. It will display the
        current user's JWT and allow you to test various custom claims.
      </p>
      <TestCustomClaims />
    </div>
  );
}