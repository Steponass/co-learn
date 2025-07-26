import { createClient } from "@/utils/supabase/server";
import ClientLayoutContent from "./ClientLayoutContent";

interface LayoutContentProps {
  children: React.ReactNode;
}

export default async function LayoutContent({ children }: LayoutContentProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ClientLayoutContent user={user}>
      {children}
    </ClientLayoutContent>
  );
}