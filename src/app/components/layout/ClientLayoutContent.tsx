"use client";

import { usePageSubtitle } from "@/app/hooks/usePageSubtitle";
import { useEffect, useState } from "react";
import Footer from "./Footer/Footer";
import Header from "./Header/Header";
import {
  SessionStoreProvider,
  useSessionStore,
} from "@/app/(main)/booking/store/SessionStore";
import { createClient } from "@/utils/supabase/client";
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

  const content = (
    <div className="layout-container">
      <Header subtitle={subtitle} user={user} />
      <main>{children}</main>
      <Footer />
    </div>
  );

  // Only wrap with SessionStore for authenticated users
  if (user) {
    return (
      <SessionStoreProvider>
        <UserInitializer userId={user.id}>{content}</UserInitializer>
      </SessionStoreProvider>
    );
  }

  return content;
}

// Component that initializes the session store with user data
function UserInitializer({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  const { setCurrentUser } = useSessionStore();
  const [userRole, setUserRole] = useState<"facilitator" | "participant">(
    "participant"
  );
  const supabase = createClient();

  // Fetch user role when user is available
  useEffect(() => {
    async function fetchUserRole() {
      try {
        console.log("[UserInitializer] Fetching role for user ID:", userId);
        const { data, error } = await supabase
          .from("user_info")
          .select("role")
          .eq("user_id", userId)
          .single();

        if (error) {
          console.error("Error fetching user role:", error);
          return;
        }

        console.log("[UserInitializer] Raw user data:", data);
        if (data?.role === "facilitator" || data?.role === "participant") {
          console.log("[UserInitializer] Fetched user role:", data.role);
          setUserRole(data.role);
        } else {
          console.log("[UserInitializer] Unknown or missing role:", data?.role);
        }
      } catch (err) {
        console.error("Error fetching user role:", err);
      }
    }

    fetchUserRole();
  }, [userId, supabase]);

  // Initialize session store with user data
  useEffect(() => {
    console.log("[UserInitializer] Setting user in store:", userId, userRole);
    setCurrentUser(userId, userRole);
  }, [userId, userRole, setCurrentUser]);

  return <>{children}</>;
}
