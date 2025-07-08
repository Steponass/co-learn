"use client"

import Link from "next/link";

export default function HomePage() {
  return (
    <div>
          <h1><Link className="link" 
          href="/dashboard">Dashboard</Link></h1>
    </div>
  );
}
