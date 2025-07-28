import { Metadata } from 'next';
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SessionPageClient from "./components/SessionPageClient";
import { getUserWithRole } from "@/utils/supabase/getUserWithRole";

interface Props {
  params: Promise<{ room_code: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: session, error } = await supabase
    .from("sessions")
    .select("title, description")
    .eq("room_code", resolvedParams.room_code)
    .single();

  // If session not found, return basic metadata
  if (!session || error) {
    return {
      title: 'Session Not Found | Co~Learn',
      description: 'The requested session could not be found.'
    };
  }

  const sessionTitle = session.title;
  const sessionDescription = session.description;

  return {
    title: `${sessionTitle} | Co~Learn`,
    description: sessionDescription
  };
}

export default async function SessionRoomPage({ params }: Props) {
  const resolvedParams = await params;
  const supabase = await createClient();
  
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("room_code", resolvedParams.room_code)
    .single();

  if (!session || error) {
    notFound();
  }

  // Fetch user and name for presence/chat
  const { user, name } = await getUserWithRole();
  if (!user) {
    notFound();
  }

  return (
    <SessionPageClient
      roomCode={resolvedParams.room_code}
      userId={user.id}
      userName={name || user.email || user.id}
      sessionTitle={session.title}
      facilitatorName={session.facilitator_name}
    />
  );
}