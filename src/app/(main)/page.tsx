import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Home | Co~Learn",
  description: "Welcome to Co~Learn, your collaborative learning platform"
};




export default function HomePage() {
  return (
    <div>
      <Link className="link" href="/dashboard">
        <h1>Dashboard</h1>
      </Link>
    </div>
  );
}
