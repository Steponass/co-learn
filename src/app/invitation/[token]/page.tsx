import { createClient } from "@/utils/supabase/server";
import { validateInvitationToken } from "@/utils/invitation-tokens";
import InvitationAcceptance from "./components/InvitationAcceptance";
import classes from "./InvitationPage.module.css";
import Link from "next/link";

interface InvitationPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function InvitationPage({ params }: InvitationPageProps) {
  const { token } = await params;
  const supabase = await createClient();

  try {
    // Validate the invitation token
    const invitation = await validateInvitationToken(token);
    
    // Check if user is already logged in
    const { data: { user } } = await supabase.auth.getUser();

    if (!invitation.sessions) {
      throw new Error('Session not found');
    }

    return (
      <div className={classes.page_container}>
        <InvitationAcceptance 
          invitation={invitation}
          session={invitation.sessions}
          currentUser={user}
          token={token}
        />
      </div>
    );
  } catch (error: unknown) {
    return (
      <div className={classes.page_container}>
        <div className={classes.error_container}>
          <h1 className={classes.error_title}>Invalid Invitation</h1>
          <p className={classes.error_message}>
            {error instanceof Error ? error.message : 'This invitation link is invalid or has expired.'}
          </p>
          <Link 
            href="/"
            className={classes.home_link + " primary_button"}
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }
}