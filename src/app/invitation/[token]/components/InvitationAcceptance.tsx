"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { markTokenAsUsed } from "@/utils/invitation-tokens";
import type { User } from "@supabase/supabase-js";
import MessageDisplay from "@/app/(main)/components/MessageDisplay";
import classes from "./InvitationAcceptance.module.css";

interface SessionData {
  id: string;
  title?: string;
  description?: string;
  start_time: string;
  time_zone: string;
  invitees: Array<{
    email: string;
    acceptedInvite: boolean;
  }>;
  user_info?: {
    name: string;
  };
}

interface InvitationData {
  invitee_email: string;
  sessions: SessionData;
}

interface InvitationAcceptanceProps {
  invitation: InvitationData;
  session: SessionData;
  currentUser: User | null;
  token: string;
}

export default function InvitationAcceptance({ 
  invitation, 
  session, 
  currentUser, 
  token 
}: InvitationAcceptanceProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupData, setSignupData] = useState({
    password: "",
    confirmPassword: "",
  });

  const supabase = createClient();

  const formatDateTime = (dateTime: string, timeZone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timeZone,
    }).format(new Date(dateTime));
  };

  const handleAcceptInvitation = async () => {
    setLoading(true);
    setError(null);

    try {
      let userId = currentUser?.id;

      // If user is not logged in, create account
      if (!currentUser) {
        if (signupData.password !== signupData.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        if (signupData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: invitation.invitee_email,
          password: signupData.password,
          options: {
            data: {
              name: invitation.invitee_email.split('@')[0], // Default name from email
            }
          }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error("Failed to create account");

        userId = authData.user.id;
      }

      // Update session invitees to mark this invitation as accepted
      const updatedInvitees = session.invitees.map((inv) => {
        if (inv.email === invitation.invitee_email) {
          return {
            ...inv,
            acceptedInvite: true,
            user_id: userId,
          };
        }
        return inv;
      });

      // Update session with accepted invitation
      const { error: sessionError } = await supabase
        .from('sessions')
        .update({ invitees: updatedInvitees })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Mark token as used
      await markTokenAsUsed(token);

      // Redirect to dashboard
      router.push('/dashboard');
      
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={classes.invitation_container}>
      <h1 className={classes.invitation_title}>Session Invitation</h1>
      
      <div className={classes.session_details_section}>
        <h2 className={classes.section_heading}>
          You are invited to join:
        </h2>
        <div className={classes.session_details_card}>
          <h3 className={classes.session_title}>
            {session.title || "Learning Session"}
          </h3>
          <p className={classes.session_host}>
            Hosted by {session.user_info?.name || "Unknown"}
          </p>
          <p className={classes.session_datetime}>
            📅 {formatDateTime(session.start_time, session.time_zone)}
          </p>
          {session.description && (
            <p className={classes.session_description}>
              {session.description}
            </p>
          )}
        </div>
      </div>

      {!currentUser && (
        <div className={classes.signup_section}>
          <h3 className={classes.section_heading}>
            Create Your Account
          </h3>
          <div className={classes.form_fields + " stack"}>
            <div className={classes.form_field}>
              <label className={classes.form_label}>
                Email (pre-filled)
              </label>
              <input
                type="email"
                value={invitation.invitee_email}
                disabled
                className={classes.form_input + " " + classes.form_input_disabled}
              />
            </div>
            <div className={classes.form_field}>
              <label className={classes.form_label}>
                Password
              </label>
              <input
                type="password"
                value={signupData.password}
                onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
                className={classes.form_input}
                placeholder="Enter password"
                required
              />
            </div>
            <div className={classes.form_field}>
              <label className={classes.form_label}>
                Confirm Password
              </label>
              <input
                type="password"
                value={signupData.confirmPassword}
                onChange={(e) => setSignupData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={classes.form_input}
                placeholder="Confirm password"
                required
              />
            </div>
          </div>
        </div>
      )}

      {currentUser && (
        <div className={classes.logged_in_notice}>
          <p className={classes.logged_in_text}>
            Logged in as: {currentUser.email}
          </p>
        </div>
      )}

      <button
        onClick={handleAcceptInvitation}
        disabled={loading}
        className="primary_button"
      >
        {loading ? "Processing..." : currentUser ? "Accept Invitation" : "Create Account & Join Session"}
      </button>

      {error && (
        <div className={classes.error_section}>
          <MessageDisplay message={error} type="error" />
        </div>
      )}

      <div className={classes.cancel_section}>
        <button
          type="button"
          onClick={() => router.push('/')}
          className={classes.cancel_link}
        >
          Cancel and go to homepage
        </button>
      </div>
    </div>
  );
}