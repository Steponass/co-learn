import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Header from "@/app/components/layout/Header/Header";
import Footer from "@/app/components/layout/Footer/Footer";

interface SessionLayoutProps {
  children: React.ReactNode;
  params: Promise<{ room_code: string }>;
}

export default async function SessionLayout({ 
  children, 
  params 
}: SessionLayoutProps) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: session, error } = await supabase
    .from("sessions")
    .select("title, facilitator_name")
    .eq("room_code", resolvedParams.room_code)
    .single();

  if (!session || error) {
    notFound();
  }

  const sessionTitle = session.title || `Hosted by ${session.facilitator_name}`;

  return (
    <>
      <Header sessionTitle={sessionTitle} />
      <main>{children}</main>
      <Footer />
    </>
  );
}