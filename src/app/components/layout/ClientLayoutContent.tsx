"use client";

import { usePageSubtitle } from "@/app/hooks/usePageSubtitle";
import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import type { User } from "@supabase/supabase-js";

interface ClientLayoutContentProps {
  user: User | null;
  children: React.ReactNode;
}

export default function ClientLayoutContent({
  user,
  children,
}: ClientLayoutContentProps) {
  const { subtitle } = usePageSubtitle();

  return (
    <div className="layout-container">
      <Header subtitle={subtitle} user={user} />
      <main>{children}</main>
      <Footer />
    </div>
  );
}