"use client";

import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <Link className="link" href="/dashboard">
        <h1>Dashboard</h1>
      </Link>
    </div>
  );
}
